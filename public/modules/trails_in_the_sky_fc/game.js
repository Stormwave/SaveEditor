class TrailsInTheSkyFC extends SaveEditorGame
{
    constructor()
    {
        super({
            name:"Trails In The Sky FC",
            version:0.1,
            author:"Andrew Cornforth",
            data:true
        });
        this.data = {};
        this.offset_adjustment = 0;
    }

    initPage()
    {
        this.changeTab(0);
        this.loadKeyData(this.data);
        $('.ui.accordion').accordion();
    }

    changeTab(n)
    {
        if (typeof n != "number")
        {
            n = parseInt(n.target.getAttribute("tab"));
        }
        document.querySelectorAll(".game-panel").forEach(el=>{ el.classList.add("hide"); el.classList.remove("show"); });
        document.querySelector(".ui.menu .item.active").classList.remove("active");
        document.querySelector(".ui.menu .item[tab='"+n+"']").classList.add("active");
        document.querySelector(".game-panel[tab='"+n+"']").classList.remove("hide");
        document.querySelector(".game-panel[tab='"+n+"']").classList.add("show");
    }

    loadData(data, file)
    {
        super.loadData(data, file);
    }

    save()
    {
        this.resolveData();
        this.downloadFile();
    }

    renderTemplate(name, template, data)
    {
        let out = "";
        switch (name)
        {
            case "character-selector":
            {
                this.data.line_up.forEach((character, index)=>
                    {
                        out += templates.render(template, character, index);
                    });
                return out;
            }
            case "character-dropdown":
            {
                this.data.characters.values.forEach((character, index)=>
                {
                    let char_out = templates.render(template, character, index);
                    if (character.id!=data.value)
                    {
                        char_out = char_out.replace(/selected=\"\"/g, "");
                    }
                    out += char_out;
                });
                return out;
            }
            case "character-field":
            {
                this.data.characters.values.forEach((character, index)=>
                {
                    out += templates.render(template, character, index);
                });
                return out;
            }
            case "category-tabs":
                {
                    this.data.inventory.forEach((category, index)=>
                        {
                            category.items = category.items.sort((a, b)=>{ return a.icon-b.icon });
                            out += templates.render(template, category, index);
                        });
                    return out;
                }
            case "category-panel":
                {
                    out += templates.render(template, category, index);
                    return out;
                } 
            case "category-item":
            {
                data.items.forEach((item, index)=>
                    {
                        let icon = item.icon;
                        let icon_x = (icon*16)%256;
                        let icon_y = Math.floor(icon/16);
                        item.icon_x = -icon_x;
                        item.icon_y = -(icon_y*16);
                        out += templates.render(template, item, index);
                    })
                return out;
            } 
        }
    }
}