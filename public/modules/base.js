class SaveEditorGame
{
    constructor(game_details)
    {
        this.details = game_details;
    }

    load()
    {
        let _self = this;
        return new Promise((resolve, reject)=>
        {
            let promises = [];
            promises.push(
                    new Promise((resolve, reject)=>
                    {
                        var xhttp = new XMLHttpRequest();
                        xhttp.responseType = "text";
                        xhttp.onreadystatechange = function() 
                        {
                            if (this.readyState == 4 && this.status == 200) 
                            {
                                resolve(xhttp.responseText);
                            }
                        };
                        xhttp.open("GET", "./modules/"+_self.details.path+"/templates.html", true);
                        xhttp.send();
                    })
            )
            if (_self.details.data)
            {
                promises.push(
                    new Promise((resolve, reject)=>
                    {
                        var xhttp = new XMLHttpRequest();
                        xhttp.responseType = "text";
                        xhttp.onreadystatechange = function() 
                        {
                            if (this.readyState == 4 && this.status == 200) 
                            {
                                // No need for data flag if already loaded
                                _self.details.data = false;
                                resolve(xhttp.responseText);
                            }
                        };
                        xhttp.open("GET", "./modules/"+_self.details.path+"/data.json", true);
                        xhttp.send();
                    })
                );
            }
            Promise.all(promises).then(values=>
                {
                    values.forEach((result, index)=>
                        {
                            switch(index)
                            {
                                case 0:
                                    {
                                        document.querySelector("active-templates").innerHTML = result;
                                    } break;
                                case 1:
                                    {
                                        let data = JSON.parse(result);
                                        _self.data = data;
                                        _self.processOffsets();
                                        if (_self.onDataLoad!=null)
                                        {
                                            _self.onDataLoad();
                                        }
                                    } break;
                            }
                        })
                    resolve();
                })
        });
    }

    processOffsets()
    {
        let keys = Object.keys(this.data.refs.data);
        keys.forEach(_key=>
            {
                let _o = eval(this.data.refs.data[_key].offset);
                this.data.refs.data[_key].offset = _o;
            });
    }

    loadData(data, filename)
    {
        this.data.file_data = new Uint8Array(data);
        this.data.file_name = filename;
        this.offsets = this.data.refs.data;
        Object.keys(this.offsets).forEach(_key=>
            {
                let _o = this.offsets[_key];
                if (_o["var-type"]==undefined)
                    switch (_o.size)
                    {
                        case 1: _o['var-type'] = "byte"; break;
                        case 2: _o['var-type'] = "short"; break;
                        case 4: _o['var-type'] = "int"; break;
                        case 8: _o['var-type'] = "double"; break;
                    }
                switch (_o.type)
                {
                    case "double":
                        {
                            this.data[_key] = this.readInt(_o.offset, 8);
                        } break;
                    case "int":
                        {
                            this.data[_key] = this.readInt(_o.offset, 4);
                        } break;
                    case "short":
                        {
                            this.data[_key] = this.readInt(_o.offset, 2);
                        } break;
                    case "byte":
                        {
                            this.data[_key] = this.readInt(_o.offset, 1);
                        } break;
                    case "mapArray":
                        {
                            this.data[_key] = this.mapArray(_o.offset, _o.maps, _o.size);
                        } break;
                    case "mapDataArray":
                        {
                            this.data[_key] = this.mapDataArray(this.readArray(_o.offset, _o.size, _o.step), _o.map, this.data.refs[_o.ref]);
                            this.data[_key].forEach(_i=>
                                {
                                    _i['type'] = _o['var-type'];
                                });
                            /*switch (_o.size)
                            {
                                case 1: this.data[_key]
                            }*/
                        } break;
                    case "struct":
                        {
                            let ml = _o["max-length"];
                            if (ml!=undefined)
                            {
                                ml *= _o.stride;
                            }
                            else
                            {
                                ml = 0;
                            }
                            let _no = { offset:_o.offset, type:"struct", stride:_o.stride, length:_o.length, keys:_o.keys, values:[], "max-length":ml };
                            let null_end = false;
                            let null_break = false;
                            // If length is -1, then read until 0
                            if (_no.length==-1) { null_end=true, _no.length=_no["max-length"] }
                            for (let n=0;n<_no.length;n++)
                            {
                                let _nk = {};
                                Object.keys(_o.keys).forEach(_k=>
                                    {
                                        let _s = 0;
                                        let val_o = null;
                                        switch (_o.keys[_k].type)
                                        {
                                            case "double": _s = 8; break;
                                            case "int": _s = 4; break;
                                            case "short": _s = 2; break;
                                            case "byte": _s = 1; break;
                                            case "index": // Value is the index of the array
                                                {
                                                    val_o = n;
                                                } break;
                                            case "map": // Value is mapped from a reference
                                                {
                                                    let _ke = null;
                                                    if (_o.keys[_k].key=="index") { _ke = n; }
                                                    val_o = this.data.refs[_o.keys[_k].ref][_ke];
                                                } break;
                                        }
                                        if (val_o==null)
                                        {
                                            let _offs = _o.offset+(n*_no.stride)+_o.keys[_k].offset;
                                            let val = this.readInt(_offs, _s).value;
                                            if (val==0 && null_end)
                                            {
                                                null_break = true;
                                            }
                                            if (!null_break && !null_end)
                                                _nk[_k] = { offset:_offs, size:_s, value:val, type:_o.keys[_k].type }
                                            else if (!null_break && null_end)
                                                _nk[_k] = val;
                                            console.log(_nk[_k]);
                                        }
                                        else
                                        {
                                            _nk[_k] = val_o;
                                        }
                                    });
                                if (!null_break)
                                    _no.values.push(_nk)
                                else
                                    break;
                            }
                            // If single block, map values direct to object instead
                            if (_no.length==1)
                            {
                                Object.keys(_no.values[0]).forEach(_k=>
                                    {
                                        _no[_k] = _no.values[0][_k];
                                    });
                            }                            
                            this.data[_key] = _no;
                        } break;
                    case "group":
                        {
                            this.data.inventory = this.groupArrays(this.data.refs[_o.ref], this.data[_o.data]);
                        } break;
                    default:
                    {
                        console.log("ERROR: Unknown type: "+_o.type);
                    } break;
                }
            });
    }

    render()
    {
        console.log("Rendering game.");
        let tpl = templates.find("main");
        tpl = templates.render(tpl, this.data);
        document.querySelector("app").innerHTML = tpl;
        this.initPage();
    }

    initPage()
    {

    }

    /* Base Functions */

    downloadFile()
    {
        var file = new Uint8Array(this.data.file_data);
        var blob = new Blob([file], {type: "octet/stream"});
        var fileUrl = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.download = this.data.file_name;
        a.href = fileUrl;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(fileUrl);
        a.remove();
    }

    readInt(offset, length=4)
    {
        if (typeof offset=="object" && offset.type!=undefined)
        {
            switch (offset.type)
            {
                case "double": return this.readInt(offset.offset, 8);
                case "int": return this.readInt(offset.offset, 4);
                case "short": return this.readInt(offset.offset, 2);
                case "byte": return this.readInt(offset.offset, 1);
            }
        }
        else
        {
            offset += this.offset_adjustment;
            let val = 0;
            for (let i=0;i<length;i++)
            {
                val += this.data.file_data[offset+i]<<(8*i);
            }
            return { value:val, offset:offset };
        }
    }

    writeInt(offset, value, length=4)
    {
        if (typeof offset=="object")
        {
            switch (offset.type)
            {
                case "double": return this.writeInt(offset.offset, value, 8); 
                case "int": return this.writeInt(offset.offset, value, 4); 
                case "short": return this.writeInt(offset.offset, value, 2);
                case "byte": return this.writeInt(offset.offset, value, 1);
            }
        }
        else
        {
            if (typeof value=="string")
            {
                value = parseInt(value);
            }
            if (offset==0)
            {
                console.log("Warning, writing to offset 0: "+value);
            }
            offset += this.offset_adjustment;
            for (let i=0;i<length;i++)
            {
                this.data.file_data[offset+i] = (value>>(8*i))&0xFF;
            }
        }
    }

    unmapDataArray(array, key, data)
    {
        let out = [];
        for (let i=0;i<array.length;i++)
        {
            let id = array[i][key];
            out.push(id);
        }
        return out;
    }

    mapDataArray(array, key, data)
    {
        let out = [];
        for (let i=0;i<array.length;i++)
        {
            out.push({ [key]:data[array[i].value], offset:array[i].offset, value:array[i].value });
        }
        return out;
    }

    writeArray(offset, stride, type_len=stride, data)
    {
        for (let i=0;i<data.length;i++)
        {
            this.writeInt(offset+(stride*i), data[i], type_len);
        }
    }

    fillData(offset, length, value)
    {
        offset += this.offset_adjustment;
        for (let i=offset;i<offset+length;i++)
        {
            this.data.file_data[i] = value;
        }
    }

    ungroupArrays(link_array, data)
    {
        let groups = Object.keys(link_array);
        let out = { keys:[], values:[] }
        for (let i=0;i<groups.length;i++)
        {
            let key = groups[i];
            groups[i] = { name:key, items:[] };
            let d = data.filter(e=>e.name==groups[i].name)[0];
            d.items.filter(e=>e.count>0).forEach(item=>
            {
                out.keys.push(item.key);
                out.values.push(parseInt(item.count));
            });
        }
        return out;
    }

    groupArrays(link_array, keys, values)
    {
        let groups = Object.keys(link_array);
        for (let i=0;i<groups.length;i++)
        {
            let key = groups[i];
            groups[i] = { name:key, items:[] };
            let _k = Object.keys(link_array[key][0])
            for (let n=0;n<link_array[key].length;n++)
            {
                if (values!=undefined)
                {
                    let index = keys.indexOf(link_array[key][n].key);
                    let count = 0;
                    if (index!=-1)
                    {
                        count = values[index];
                    }
                    let _item = { name:link_array[key][n].name, count:count, key:link_array[key][n].key, group:key.toLowerCase() };
                    _k.forEach(__k=>
                        {
                            if (_item[__k]==undefined)
                            {
                                _item[__k] = link_array[key][n][__k];
                            }
                        })
                    groups[i].items.push(_item);
                }
                else
                {
                    let index = keys.values.findIndex(e=>e.key==link_array[key][n].key);
                    let count = 0;
                    if (index!=-1)
                    {
                        count = keys.values[index].value;
                    }
                    let _item = { name:link_array[key][n].name, count:count, key:link_array[key][n].key, group:key.toLowerCase() };
                    _k.forEach(__k=>
                        {
                            if (_item[__k]==undefined)
                            {
                                _item[__k] = link_array[key][n][__k];
                            }
                        })
                    groups[i].items.push(_item);
                }
            }
        }
        return groups;
    }

    readStructArray(obj, offset, length, stride, base=null)
    {
        let output = [];
        let _keys = Object.keys(obj);
        for (let i=0;i<length;i++)
        {
            let _out = {};
            _keys.forEach(key=>
                {
                    let part = obj[key];
                    if (part.offset==undefined)
                    {
                        if (part.base_key!=undefined)
                        {
                            _out[key] = parseInt(Object.keys(base)[i]);
                        }
                        if (part.base_val!=undefined)
                        {
                            _out[key] = base[i];
                        }
                    }
                    else
                    {
                        let val = this.readInt((offset+(i*stride))+part.offset, part.length);
                        _out[key] = val;
                    }
                });
            output.push(_out);
        }
        return output;
    }

    sortCategory(obj)
    {
        let _keys = Object.keys(obj);
        _keys.forEach((key)=>
            {
                let _cat = obj[key];
                _cat.sort((a, b)=>a.key-b.key);
            });
    }

    toTitle(title)
    {
        let t_parts = title.replace(/_/g, " ").split(" ");
        for (let i=0;i<t_parts.length;i++)
        {
            if (t_parts[i].length<=2)
            {
                t_parts[i] = t_parts[i].toUpperCase();
            }
            else
            {
                t_parts[i] = t_parts[i][0].toUpperCase()+t_parts[i].substr(1);
            }
        }
        return t_parts.join(" ");    
    }

    mergeStructArray(_target, obj, key="id")
    {
        _target.forEach(item=>
            {
                let m = obj.filter(e=>e[key]==item[key]);
                if (m.length>0)
                {
                    m = m[0];
                    let keys = Object.keys(m);
                    keys.forEach(key=>
                        {
                            if (item[key]==undefined)
                            {
                                item[key] = m[key];
                            }
                        });
                }
            });
    }

    readArray(offset, length, stride, type_len=stride, break_val=0)
    {
        let out = [];
        let _offset = offset;
        if (typeof offset=="object")
        {
            _offset = offset.offset;
        }
        if (length>0)
        {
            for (let i=0;i<length;i++)
            {
                out[i] = this.readInt(_offset+(stride*i), type_len);
            }
        }
        else
        {
            let i = 0;
            while (true)
            {
                // If reading past the end of the file, break
                if (_offset+(stride*i)>this.data.file_data.length-4) { break; }
                let val = this.readInt(_offset+(stride*i), type_len);
                // If val==0 then break, end of list
                if (val==break_val) { break; }
                out[i++] = val;
            }
        }
        return out;
    }

    writeMapArray(offset, map, stride, data)
    {
        let _offset = offset;
        if (typeof offset=="object")
        {
            _offset = offset.offset;
        }
        for (let i=0;i<map.length;i++)
        {
            this.writeInt(_offset+(stride*i), data[map[i]], stride);
        }
    }

    mapArray(offset, map, stride)
    {
        let out = {};
        let _offset = offset;
        if (typeof offset=="object")
        {
            _offset = offset.offset;
        }
        for (let i=0;i<map.length;i++)
        {
            out[map[i]] = this.readInt(_offset+(stride*i), stride);
        }
        return out;
    }

    readShort(offset)
    {
        return this.readInt(offset, 2);
    }

    writeShort(offset, value)
    {
        this.writeInt(offset, value, 2);
    }

    readLong()
    {
        return this.readInt(offset, 8);
    }

    writeLong(offset, value)
    {
        this.writeInt(offset, value, 8);
    }

    findValue(root, name, attempt=0)
    {
        let p = name.split(".");
        let obj = root;
        for (let i=0;i<p.length;i++)
        {
            let f = p[i];
            let _f = f.split("|");
            if (_f.length==2 && typeof obj[_f[0]]=="number")
            {
                obj = obj[_f[0]];
                obj += parseInt(_f[1]);
                return obj;
            }
            else
            {
                obj = obj[_f[0]];
                if (obj==undefined) 
                { 
                    if (attempt>5)
                    {
                        return null;
                    }
                    return this.findValue(root, name.replace(/\./g, "_"), attempt+1);
                }
            }
        }
        return obj;
    }

    findField(name)
    {
        let obj = {};
        obj.name = name;
        obj.value = this.findValue(this.data, name);
        obj.offset = this.findValue(this.offsets, name);
        return obj;
    }

    unmapData(offsets, data, params)
    {
        Object.keys(offsets).forEach(_key=>
            {
                let offset = offsets[_key];
                let step = params[_key+"_step"];
                if (typeof data[_key]=="object")
                {
                    if (step==undefined)
                    {
                        
                    }
                    else
                    {
                        Object.keys(data[_key]).forEach((__key, index)=>
                        {
                            if (typeof data[_key][__key]=="number")
                            {
                                let value = data[_key][__key];
                                if (step!=null)
                                {
                                    console.log("Saving "+_key+"."+__key);
                                    let _offset = offset;
                                    if (typeof offset=="object")
                                    {
                                        _offset = offset.offset;
                                    }
                                    this.writeInt(_offset+step*index, value, step);
                                }
                            }
                            else
                            {
                                console.log("Unimplemented type "+typeof data[_key][__key]+" for key: "+_key+"."+__key);
                            }
                        });
                    }
                }
                else if (data[_key]!=undefined)
                {
                    console.log("Saving "+_key);
                    this.writeInt(offset, data[_key]);
                }
            });
    }


    /* Generic Form Functions */


    storeData()
    {
        let _self = this;
        document.querySelectorAll("app [field]").forEach(el=>
        {
            let o = _self.findField(el.getAttribute("field"));
            switch (typeof o.value)
            {
                case "number":
                {
                    o.value = parseInt(el.value);
                } break;
                default:
                {
                    o.value = el.value;
                } break;
            }
            let p = o.name.split(".");
            let obj = _self.data;
            for (let i=0;i<p.length-1;i++)
            {
                let f = p[i].split("|");
                obj = obj[f[0]];
            }
            obj[p[p.length-1]] = o.value;
        });
    }

    fillData()
    {
        let _self = this;
        document.querySelectorAll("app [field]").forEach(el=>
        {
            let o = _self.findField(el.getAttribute("field"));
            if (el.onchange==null)
            {
                el.onchange = (event)=>
                {
                    _self.storeData();
                }
            }
            el.value = o.value;
        });
    }

    /* New helper functions */

    findObjFromKey(key, data)
    {
        let p = key.split(".");
        let _obj = data;
        for (let n=0;n<p.length;n++)
        {
            let _s = p[n];
            if (_s.indexOf("[")!=-1)
            {
                let _v = parseInt(_s.substr(_s.indexOf("[")+1, _s.length-_s.indexOf("[")-2));
                _s = _s.substr(0, _s.indexOf("["));
                if (!isNaN(_v))
                {
                    console.log(_v, p[n]);
                    _obj = _obj[_s];
                    if (_obj==undefined) { return undefined; }
                    _obj = _obj[_v];
                }
            }
            else
            {
                _obj = _obj[_s];
            }
            if (_obj==undefined) { break; }
        }
        if (_obj.offset!=undefined)
        {
            // Match with offset from refs
            let _refs = data.refs.data;
            for (let n=0;n<p.length;n++)
            {
                let _s = p[n];
                if (_s.indexOf("[")!=-1)
                {
                    _s = _s.substr(0, _s.indexOf("["));
                }
                else
                {
                    // Not a direct path match
                    if (_refs[p[n]]==undefined)
                    {
                        if (_refs[p[n-1]+"_"+p[n]]!=undefined) // Found an _ match instead of .
                        {
                            _refs = _refs[p[n-1]+"_"+p[n]];
                        }
                    }
                    else
                        _refs = _refs[p[n]];
                }
            }
            if (_refs!=undefined)
            {
                if (_obj.type==undefined)
                {
                    _obj.type = _refs.type;
                    if (_refs["var-type"]!=undefined)
                    {
                        _obj.type = _refs["var-type"];
                    }
                }
                _obj._ref = key;
            }
            return _obj;
        }
        else
        {
            return undefined;
        }
    }

    loadKeyData(data)
    {
        document.querySelector("app").querySelectorAll("input[key], select[key]").forEach(input=>
            {
                let key = input.getAttribute("key");
                let _obj = this.findObjFromKey(key, data);
                if (_obj!=undefined)
                {
                    if (input.value=="" || input.value==undefined)
                        input.value = _obj.value;
                    input.setAttribute("offset", _obj.offset);
                    if (_obj.type=="struct")
                    {
                        input.setAttribute("key-type", _obj.keys.key.type);
                        input.setAttribute("value-type", _obj.keys.value.type);
                    }
                    else
                        input.setAttribute("var-type", _obj.type);
                }
            });
    }

    getTypeSize(type)
    {
        switch (type)
        {
            case "int": return 4;
            case "byte": return 1;
            case "short": return 2;
            case "double": return 8;
        }
    }

    resolveData()
    {
        let filled = [];
        document.querySelectorAll("input[key], select[key]").forEach(input=>
            {
                let key = input.getAttribute("key");
                let offset = input.getAttribute("offset");
                let type = input.getAttribute("var-type");
                let value = input.value;
                if (offset!=null)
                {
                    if (type==null)
                    {
                        let key_type = input.getAttribute("key-type");
                        let val_type = input.getAttribute("value-type");
                        // Clear enough space in file data to allow all keys, and only if this is the first for this reference
                        if (filled.findIndex(e=>e.key==key)==-1)
                        {
                            let _ref = this.data[key];
                            if (_ref!=undefined)
                            {
                                console.log(key+": Clearing from offset "+offset+" to "+(parseInt(offset)+parseInt(_ref['max-length'])));
                                for (let n=offset;n<parseInt(offset)+parseInt(_ref['max-length']);n++)
                                {
                                    this.data.file_data[n] = 0;
                                }
                                filled.push({ key:key, index:0 });
                            }
                        }
                        let _fi = filled.findIndex(e=>e.key==key);
                        let _offs = parseInt(offset)+filled[_fi].index;
                        let key_size = this.getTypeSize(key_type);
                        let val_size = this.getTypeSize(val_type);
                        let key_val = parseInt(input.getAttribute("key-id"));
                        if (value!=0)
                        {
                            console.log(key+": Writing key: "+key_val+" ("+key_type+"), value: "+value+" ("+val_type+") to offset: "+_offs);
                            this.writeInt(_offs, key_val, key_size);
                            this.writeInt(_offs+key_size, value, val_size);
                            filled[_fi].index += key_size+val_size;
                        }
                        
                        /*for (let n=offset;n<;n++)
                        {

                        }*/
                    }
                    else
                    {
                        this.writeInt(parseInt(offset), value, this.getTypeSize(type));
                        console.log(key+": Writing "+value+" as "+type+" to offset: "+offset);
                    }
                }
            });
    }
}