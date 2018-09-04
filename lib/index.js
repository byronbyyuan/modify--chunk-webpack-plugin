const sourceMappingURL = require('source-map-url');
class customChunkWebpackPlugin {
    constructor(options){
        this.options = {
            basePath:'', //string
            cssChunk:null,
            jsChunk:null,
            customBase:null,
            start:'end', // or start 插入的位置
            addPath:{}, // Object
            customAdd:null, //自定义处理函数 优先级高
            InlineChunk:[],
            ...options
        }; 
        this.cssTemplate = {
            tagName: 'link',
            selfClosingTag: false,
            voidTag: true,
            attributes:{ href: '', rel: 'stylesheet' }
        }
        this.jsTemplate = {
            tagName:'script',
            closeTag: true,
            attributes:{ type: 'text/javascript',src: ''}
        }
        this.InlinejsTemplate = {...this.jsTemplate,attributes:{ type: 'text/javascript' },innerHTML:''}
        this.InlinecssTemplate = {
            tagName:'style',
            closeTag: true,
            attributes:{ type: 'text/css' },
            innerHTML:''
        }
    };
    apply(compiler){
        compiler.plugin('compilation', (compilation, callback) => {
            compilation.plugin('html-webpack-plugin-before-html-processing',(htmlPluginData, callback)=>{        
                const result = this.complete(htmlPluginData);
                if (callback) {
                    callback(null, htmlPluginData);
                } else {
                    return Promise.resolve(htmlPluginData);
                }
            })
            compilation.plugin('html-webpack-plugin-alter-asset-tags',(htmlPluginData, callback)=>{ 
                this.InlineChunk(this.options.InlineChunk,compilation,htmlPluginData)
                htmlPluginData.head.set = options => this.customAddResult(htmlPluginData.head,options);
                htmlPluginData.body.set = options => this.customAddResult(htmlPluginData.body,options); 
                if((typeof this.options.customAdd === 'function'))this.options.customAdd(htmlPluginData.head,htmlPluginData.body)
                if (callback) {
                    callback(null, htmlPluginData);
                } else {
                    return Promise.resolve(htmlPluginData);
                }
            })            
      });                 
    }
    complete(PluginData){
        let op = this.options;
        if((typeof op.customBase === 'function')){
            PluginData['assets'] = op.customBase(PluginData['assets']);
        }else if(this.isString(op.basePath)){
            PluginData['assets']['js'] = this.setBase(PluginData['assets']['js'],'jsChunk');
            PluginData['assets']['css'] = this.setBase(PluginData['assets']['css'],'cssChunk');
        }
        if((typeof op.customAdd === 'function')){
            // PluginData['assets'] = op.customAdd(PluginData['assets']); 函数更换处理
        }else if((this.isObject(op.addPath))){
            PluginData['assets']['js'] = this.addPathHandel(PluginData['assets']['js'],'js');
            PluginData['assets']['css'] = this.addPathHandel(PluginData['assets']['css'],'css');            
        }
    }
    replaceChunk(chunk,compilation,htmlPluginData){
        let name = compilation.chunks.find(item => item.name === chunk).files.find(item=>item.indexOf('.js')>-1),
            tag = ['body','head'];
            if(name){
                tag.forEach(key => {
                    htmlPluginData[key] = htmlPluginData[key].map(item=>{
                       if(item.tagName === 'script' && item.attributes.src && item.attributes.src.indexOf(chunk) > -1){
                           item = JSON.parse(JSON.stringify(this.InlinejsTemplate));
                           item.innerHTML = sourceMappingURL.removeFrom(compilation.assets[name].source());
                            return item;
                       }
                       return item;
                   })
               })                
            }
    }
    InlineChunk(options,compilation,htmlPluginData){
        if(this.isArray(options)){
            options.forEach(item=>this.replaceChunk(item,compilation,htmlPluginData))
        }else if(this.isString(options)){
            this.replaceChunk(options,compilation,htmlPluginData)
        }
    }
    customAddResult(data,options){
        if(this.isArray(options)){
            options.forEach(item=>{
                let op = {
                    tag:null,
                    start:'end',
                    type:null,
                    src:null,
                    innerHTML:null, 
                    ...item         
                },result = false;
                if(op.type === 'Inline' && this.isString(op.innerHTML)){
                    result = JSON.parse(JSON.stringify(this['Inline' + op.tag + 'Template']));
                    result.innerHTML = op.innerHTML;
                }else if(this.isString(op.tag) && this.isString(op.src) && ['js','css'].includes(op.tag)){
                    result = JSON.parse(JSON.stringify(this[op.tag + 'Template']));
                    result.attributes[op.tag === 'js' ? 'src':'href'] = op.src;                                 
                }   
                result && op.start === 'start' ? data.unshift(result) : data.push(result); 
            })
        }
    }
    setBase(data,Chunks){
        let op = this.options;
            Chunks = op[Chunks];
        if(this.isString(Chunks)){
            data = data.map(item=> { 
                if(Chunks === 'all')return op.basePath + item;
                return item.indexOf(Chunks) > -1 ? op.basePath + item : item;
            })
        }else if(this.isArray(Chunks)){
            Chunks.forEach(chunk=>{
                let index = data.findIndex(item => item.indexOf(chunk)>-1);
                index >= 0 ? data[index] = op.basePath +  data[index] : '';
            })
        }
        return data;
    }
    addPathHandel(data,tag){
        let { start , addPath } = this.options;
        tag = addPath[tag];
        if(this.isString(tag)){
            start === 'start' ? data.unshift(tag) : data.push(tag)
        }else if(this.isArray(tag)){
            data = start === 'start' ? tag.concat(data) : data.concat(tag);
        }  
        return data;      
    }
    isObject(obj) { 
        if(!(typeof obj === 'object'))return false;
        for(var name in obj) { 
            if(obj.hasOwnProperty(name)) { 
                return true; 
            } 
        } 
        return false; 
    }     
    isString(str){
        return typeof str === 'string' && str.trim().length > 0;
    }
    isArray(arr){
       return Array.isArray(arr) && arr.length > 0;
    }
}
module.exports = customChunkWebpackPlugin;