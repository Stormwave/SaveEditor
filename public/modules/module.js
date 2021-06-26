class SaveEditorModule
{
    constructor()
    {
    }

    loadFileData(file_data, file_name)
    {
        this.data.file_name = file_name;
        this.data.file_data = file_data;
    }

    setPath(path)
    {
        return new Promise((resolve, reject)=>
        {
            this.path = path;
            let _self = this;
            fetch(this.path+this.template_file).then(file_data=>
                {
                    file_data.arrayBuffer().then(data=>
                        {
                            let file_data = String.fromCharCode.apply(null, new Uint8Array(data));
                            _self.template = file_data;
                            resolve();
                        });
                });
            });
    }

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
        let val = 0;
        for (let i=0;i<length;i++)
        {
            val += this.data.file_data[offset+i]<<(8*i);
        }
        return val;
    }

    writeInt(offset, value, length=4)
    {
        if (typeof value=="string")
        {
            value = parseInt(value);
        }
        if (offset==0)
        {
            console.log("Warning, writing to offset 0: "+value);
        }
        for (let i=0;i<length;i++)
        {
            this.data.file_data[offset+i] = (value>>(8*i))&0xFF;
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
            out.push({ [key]:data[array[i]], id:array[i] });
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
        for (let i=offset;i<offset-length;i++)
        {
            this.file_data[i] = value;
        }
    }

    ungroupArrays(link_array, keys, values, data)
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
                let k = link_array[groups[i].name];
                let key = k.filter(e=>e.name==item.name)[0];
                if (key!=undefined)
                {
                    key = key.key;
                    out.keys.push(key);
                    out.values.push(parseInt(item.count));
                }
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
            for (let n=0;n<link_array[key].length;n++)
            {
                let index = keys.indexOf(link_array[key][n].key);
                let count = 0;
                if (index!=-1)
                {
                    count = values[index];
                }
                groups[i].items.push({ name:link_array[key][n].name, count:count });
            }
        }
        return groups;
    }

    readArray(offset, length, stride, type_len=stride)
    {
        let out = [];
        if (length>0)
        {
            for (let i=0;i<length;i++)
            {
                out[i] = this.readInt(offset+(stride*i), type_len);
            }
        }
        else
        {
            let i = 0;
            while (true)
            {
                // If reading past the end of the file, break
                if (offset+(stride*i)>this.data.file_data.length-4) { break; }
                let val = this.readInt(offset+(stride*i), type_len);
                // If val==0 then break, end of list
                if (val==0) { break; }
                out[i++] = val;
            }
        }
        return out;
    }

    writeMapArray(offset, map, stride, data)
    {
        for (let i=0;i<map.length;i++)
        {
            this.writeInt(offset+(stride*i), data[map[i]], stride);
        }
    }

    mapArray(offset, map, stride)
    {
        let out = {};
        for (let i=0;i<map.length;i++)
        {
            out[map[i]] = this.readInt(offset+(stride*i), stride);
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

    getData()
    {
        this.data.module_obj = this;
        return this.data;
    }

    getTemplate()
    {
        return this.template;
    }

    getMethods()
    {
        return { 
        };
    }

    getMounted()
    {
        console.log(this.name+" loaded...");
        $(".ui.accordion").accordion();
        $('.ui.dropdown').dropdown();
    }

    getUpdated()
    {
        console.log(this.name+" updated...");
        $(".ui.accordion").accordion();
        $('.ui.dropdown').dropdown();
    }
}

export { SaveEditorModule }