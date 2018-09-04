#custom-chunk-webpack-plugin

##  作用是什么？
#### HtmlWebpackPlugin 能很好地帮我们注入打包的入口文件,但我们可能有需要更细粒化操作比如：    
+ 需要将某个chunk内联。
+ 需要移动某个chunk的位置，由body移动到head。
+ 甚至是不需要某个chunk，这种能够自定义操作出口的文件的可能。
+ 添加一段路径或者内联一段代码.
#### webpack 出口的publicPath一旦设置,所有的资源都会加上该路径，可能我们需要自定义chunk路径:
+ 有时候可能说某个出口chunk,必如来自第三方包的出口文件需要开启cdn，但其他的chunk不需要
  
## options参数
| key         | Description(优先级*)    |    value(type)                          |     default                  |
| :--------:  | :-----------------:     |   :------------------------------------:|   :------------------------:  |
| basePath    | 添加的路径前缀          |                url                       |    ``                         |
| cssChunk    | 需要添加chunk名称*      |  chunkName/all/[chunkName]              |    ``                         |
| jsChunk     | 需要添加chunk名称*      |  chunkName/all/[chunkName]              |    ``                      |         
| customBase  | 自定义设置路径的函数**   |  回调函数 function(返回值)               |    ``                      |
| start       | 添加一个文件的路径的位置 |  start/end{String}                      |    end                        |
| addPath     | 添加文件的对象*         |Object{js/css{String|Array} }             |     ``                         |
| customAdd   | 自定义添加文件的函数**  |  回调函数 function                       |    ``                          |
| InlineChunk | 将chunk变为内联        |  chunkName/[chunkName]                   |    ``                        |

###webpack.config.js
```
const customChunkWebpackPlugin = require('custom-chunk-webpack-plugin')
{
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new customChunkWebpackPlugin({
      basePath:'http://...',
      jsChunk:'vendors',
      cssChunk:'all',
      InlineChunk:'runtime',
    })
  ]
}
```

### 添加前缀实例
``` 
    new customChunkWebpackPlugin({
      basePath:'http://...',
      jsChunk:['vendors','app'],
      cssChunk:'all',
    })
```
``` 
    new customChunkWebpackPlugin({
      basePath:'http://...',//无效
      jsChunk:['vendors','app'],//无效
      cssChunk:'all',//无效
      customBase:asset =>{ //有效 函数优先级最高
        asset['js'][0] = 'http://...' + asset['js'][0] 
        return asset
      },      
    })
```

### chunk转内联
``` 
    new customChunkWebpackPlugin({
        InlineChunk:'runtime'
    })
```
``` 
    new customChunkWebpackPlugin({
        InlineChunk:['runtime','app']
    })
```


### 添加路径
``` 
    // 这种方式添加的所有都基于start的值来,默认是end 添加到当前已有的chunk后面
    // js只会添加到body无法移动到head
    new customChunkWebpackPlugin({
      start:'start', 
      addPath:{
        js:'http://cdn.comxxx.js',
        css:['http://cdn.com/xx/xx.css','/xx/xx.css']
      },
    })
```
``` 
    //参数head和body都是之后的html标签所需要加载的内容的数组项
    //你可以通过head.set 或者body.set 的方法来插入你要的内容
    //如果你需要更自由的方式 那你可以直接操作这两个对象
    new customChunkWebpackPlugin({
        //set的方式body与head使用方式相同 以head为例,参数只能是数组 否则无效
        //插入的位置同样以start来作为位置的标识
        customAdd:(head,body)=>{
            head.set([          
                {
                    type:'Inline', //存在src的值 也会只处理Inline
                    innerHTML:'var a = 1', //到这一部的代码是无法再压缩的
                    tag:'css', //插件不会去检查是否合格，很明显这是错误的 他将生成 style标签 但值是js
                    src:'http://xxxx.xxx'
                },
                {
                    type:'Inline',
                    innerHTML:'var a = 1', //到这一部的代码是无法再压缩的
                    tag:'js',
                },                          
                {
                    tag:'js',
                    src:'http://xxxx.xxx',
                },
                {
                    start:'start', 
                    tag:'js',
                    src:'http://xxxx.xxx',            
                }
          ])
        }
    })
```
``` 
    // 自定义操作head和body
    // 插入节点的模板
    let cssTemplate = {
        tagName: 'link',
        selfClosingTag: false,
        voidTag: true,
        attributes:{ href: '', rel: 'stylesheet' }
    }
    let jsTemplate = {
        tagName:'script',
        closeTag: true,
        attributes:{ type: 'text/javascript',src: ''}
    }
    let InlinejsTemplate = {...this.jsTemplate,attributes:{ type: 'text/javascript' },innerHTML:''}
    let InlinecssTemplate = {
        tagName:'style',
        closeTag: true,
        attributes:{ type: 'text/css' },
        innerHTML:''
    }    
    new customChunkWebpackPlugin({
        customAdd:(head,body)=>{
            head.push({
                tagName:'script',
                closeTag: true,
                attributes:{ type: 'text/javascript',src: ''http://xxxx.xxx''}                
            })
        }
    })
```


### 缺陷 

#### 无法做到异步加载的chunk自定义，只能做到出口的chunk修改，下个版本将考虑实现更全面更细化的控制的可能。
