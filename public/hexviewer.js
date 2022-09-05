// Created by Andrew Cornforth (Stormwave Digital Design) 2022

class HexViewer
{
    constructor()
    {
        this.data = null;
        this.view_width = 32;
        this.visible_rows = 32;
        this.hex = "0123456789ABCDEF";
        this.row_height = 22;
        this._last_data_top = -1;
        this.null_ascii = [ 10 ];
        this.row_width = 80+(28.5*this.view_width)+40;
        this.text_width = (6.5*this.view_width)+40;
        this.search_result = { offset:0, width:0 };
    }

    load(data)
    {
        this.data = data;
    }

    refresh()
    {
        let h = document.querySelector(".hex-viewer .scroller").getBoundingClientRect().height;
        document.querySelector(".hex-viewer .scroller").style.width = this.row_width+"px";
        if (h>0)
        {
            this.total_rows = Math.ceil(this.data.byteLength/this.view_width);
            this.visible_rows = Math.ceil(h/this.row_height)+1;
            for (let y=0;y<this.visible_rows;y++)
            {
                let row = document.createElement("div");
                row.classList.add("row");
                row.style.position = "absolute";
                let offset_cell = document.createElement("div");
                offset_cell.classList.add("offset");
                row.appendChild(offset_cell);
                for (let x=0;x<this.view_width;x++)
                {
                    let cell = document.createElement("span");
                    row.appendChild(cell);
                }
                let cell = document.createElement("span");
                cell.classList.add("text");
                row.appendChild(cell);
                document.querySelector(".hex-viewer .body").style.overflow = "hidden";
                document.querySelector(".hex-viewer .body").appendChild(row);
            }
            this.total_height = this.total_rows*this.row_height;
            document.querySelector(".hex-viewer .body").style.height = this.total_height+"px";
            document.querySelector(".hex-viewer .scroller").onscroll = hexviewer.scroll;
            hexviewer.scroll(null);
        }
    }

    scroll(e)
    {
        let st = document.querySelector(".hex-viewer .scroller").scrollTop;
        let top_offset = st-(st%hexviewer.row_height);
        let data_top_percent = st/hexviewer.total_height;
        let start_data_top = Math.floor(hexviewer.total_rows*data_top_percent)*hexviewer.view_width;
        let rows = document.querySelectorAll(".hex-grid .body .row");
        let matched_rows = [];
        let unmatched_rows = [];
        for (let y=0;y<hexviewer.visible_rows;y++)
        {
            let data_top = start_data_top+(y*hexviewer.view_width);
            let found = false;
            for (let n=0;n<rows.length;n++)
            {
                let row = rows[n];
                if (parseInt(row.querySelector(".offset").getAttribute("offset"))==data_top)
                {
                    row.style.top = (top_offset+(y*hexviewer.row_height))+"px";
                    matched_rows.push(row);
                    found = true;
                    break;
                }
            }
            if (!found)
            {
                unmatched_rows.push(y);
            }
        }
        let max_width = 0;
        unmatched_rows.forEach(y=>
        {
            let data_top = start_data_top+(y*hexviewer.view_width);
            // Find next available row
            for (let n=0;n<rows.length;n++)
            {
                if (matched_rows.indexOf(rows[n])==-1)
                {
                    matched_rows.push(rows[n]);
                    let offset_cell = rows[n].querySelector(".offset");
                    offset_cell.innerHTML = data_top.toString(16).toUpperCase();
                    offset_cell.setAttribute("offset", data_top);
                    rows[n].style.top = (top_offset+(y*hexviewer.row_height))+"px";
                    let values = [];
                    rows[n].querySelectorAll("span:not(.text)").forEach((cell, index)=>
                    {
                        let _v = hexviewer.data[data_top+index];
                        if (hexviewer.null_ascii.indexOf(_v)!=-1) _v = 0;
                        values.push(_v);
                        if (_v==undefined)
                        {
                            cell.innerText = "";
                        }
                        else
                        {
                            let _h = _v.toString(16);
                            if (_h.length<2) _h = "0"+_h;
                            cell.innerText = _h.toUpperCase();
                        }
                    });
                    rows[n].querySelector("span.text").innerText = String.fromCharCode(...values);
                    let row_width = rows[n].getBoundingClientRect().width;
                    if (row_width>max_width)
                    {
                        max_width = row_width;
                    }
                    break;
                }
            }
        });
        hexviewer._last_data_top = start_data_top;
    }

    search(type)
    {
        let input = document.querySelector(".hex-viewer .hex-tools #search").value;
        let parts = [];
        switch (type)
        {
            case "hex":
                {
                    if (input.length%2!=0)
                    {
                        input = "0"+input;
                    }
                    for (let i=0;i<input.length;i+=2)
                    {
                        let hex = input.substr(i, 2);
                        parts.push(parseInt(hex, 16));
                    }
                } break;
            case "dec":
                {
                    input = parseInt(input).toString(16);
                    if (input.length%2!=0)
                    {
                        input = "0"+input;
                    }
                    for (let i=0;i<input.length;i+=2)
                    {
                        let hex = input.substr(i, 2);
                        parts.push(parseInt(hex, 16));
                    }
                } break;
            case "txt":
                {
                    for (let i=0;i<input.length;i++)
                    {
                        parts.push(input.charCodeAt(i));
                    }
                } break;
        }
        let matches = [];
        for (let i=0;i<this.data.length;i++)
        {
            let fail = true;
            for (let n=0;n<parts.length;n++)
            {
                if (this.data[i+n]==parts[n])
                {
                    fail = false;
                }
                else
                {
                    fail = true;
                    break;
                }
            }
            if (!fail)
            {
                matches.push(i);
            }
        }
        if (matches.length>0)
        {
            let found = false;
            for (let n=0;n<matches.length;n++)
            {
                if (this.search_result.offset<matches[n])
                {
                    found = true;
                    this.search_result.offset = matches[n];
                    break;
                }
            }
            if (!found)
            {
                this.search_result.offset = matches[0];
            }
            this.search_result.width = parts.length;
            this.highlight_search();
        }
        document.querySelector("hex-viewer .hex-tools .search-results").innerText = matches.length+(matches.length==1?" result":" results");
        document.querySelector("hex-viewer .hex-tools .search-results").style.display = "block";
        document.querySelector("hex-viewer .hex-tools .search-results").style.left = "14px";
        document.querySelector("hex-viewer .hex-tools .search-results").style.position = "relative";
    }

    highlight_search()
    {
        // Scroll to nearest offset
        let _s = this.search_result.offset;
        let _sp = ((_s/this.view_width)/(this.data.length/this.view_width));
        let m_h = document.querySelector(".hex-viewer .scroller").scrollHeight-document.querySelector(".hex-viewer .scroller").clientHeight;
        let s_t = Math.round((_sp*m_h)-(this.row_height*1));
        if (document.querySelector(".hex-viewer .scroller").scrollTop!=s_t)
        {
            document.querySelectorAll("hex-viewer .row span:not(.text)").forEach(el=>el.classList.remove("highlight"));
            document.querySelector(".hex-viewer .scroller").scrollTop = s_t;
            setTimeout(()=>{ hexviewer.highlight_search() }, 100);
        }
        else
        {
            // Find closest to row to start offset
            let _e = this.search_result.offset+this.search_result.width;
            let _so = Math.floor(_s/this.view_width)*this.view_width;
            let _eo = Math.floor(_e/this.view_width)*this.view_width;
            for (let n=_so;n<=_eo;n+=this.view_width)
            {
                let row = document.querySelector("hex-viewer .row .offset[offset='"+n+"']");
                if (row!=null)
                {
                    row = row.parentElement;
                    let cells = row.querySelectorAll("span:not(.text)");
                    if (n>_s && n!=_eo)
                    {
                        cells.forEach(el=>el.classList.add("highlight"));
                    }
                    else if (n<_s && n<_e)
                    {
                        let _si = _s-n;
                        for (let i=_si;i<_si+this.search_result.width;i++)
                        {
                            if (i>this.view_width) { break; }
                            cells[i].classList.add("highlight");
                        }
                    }
                    else if (n>_s && n==_eo)
                    {
                        let _ei = _e-n;
                        for (let i=0;i<(_ei || this.view_width);i++)
                        {
                            console.log(i);
                            cells[i].classList.add("highlight");
                        }
                    }
                }
            }
        }
    }

    show()
    {
        if (document.querySelector("body>.hex-viewer")==null)
        {
            let tpl = templates.find("hex-viewer");
            tpl = templates.render(tpl, active_game);
            document.querySelector("body>hex-viewer").innerHTML = tpl;
            document.querySelector("body>hex-viewer").classList.add("hex-viewer");
            document.querySelector("nav").classList.add("disabled");
            document.querySelector("app").classList.add("disabled");
            document.querySelector("modal-close").style.display = "block";
            document.querySelector("modal-close").onclick = ()=>
            {
                hexviewer.hide();
            }
        }
    }

    hide()
    {
        document.querySelector("nav").classList.remove("disabled");
        document.querySelector("app").classList.remove("disabled");
        document.querySelector("body>hex-viewer").innerHTML = "";
        document.querySelector("body>hex-viewer").classList.remove("hex-viewer");
        document.querySelector("modal-close").style.display = "none";
        this.data = null;
        this._last_data_top = -1;
        this.search_result = { offset:0, width:0 };
    }

    renderTemplate(name, template, data)
    {
        switch (name)
        {
            case "top":
                {
                    let out = "<div class='offset'></div>";
                    for (let n=0;n<this.view_width;n++)
                    {
                        out += "<span>"+Math.floor(n/16)+this.hex[n%16]+"</span>";
                    }
                    out += "<span class='text-column' style='width:"+this.text_width+"px'>Text</span>";
                    return out;
                } break;
            case "body":
                {
                    let out = "";
                    setTimeout(()=>
                    {
                        hexviewer.refresh();
                    });
                    return out;
                } break;
        }
    }
}
var hexviewer = new HexViewer();