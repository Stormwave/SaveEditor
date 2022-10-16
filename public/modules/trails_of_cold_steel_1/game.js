class TrailsOfColdSteel1 extends SaveEditorGame
{
    constructor()
    {
        super({
            name:"Trails Of Cold Steel 1",
            sort_name:"trails_of_cold_steel_1",
            group:"Trails Of Cold Steel",
            version:0.1,
            author:"Andrew Cornforth",
            data:true,
            file_extension:"dat",
            paths:
            [
                "%UserProfile%/Saved Games/FALCOM/ed8"
            ]
        });
        this.data = {};
        this.data.category = {};
        this.data.inventory = [];
        this.data.line_up = [];
        this.data.characters = [];
        this.data.mira = 0;
        this.data.bracer_rank = 0;
        this.data.battles = { count:0, lost:0, won:0, fled:0 };
        this.data.seriph = [];
        this.data.char_exp = [];
        this.offset_adjustment = 0;
    }

    initPage()
    {
        this.changeTab(1);
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

    onDataLoad()
    {
        let k = Object.keys(this.data.refs.offsets);
        k.forEach(key=>{ this.data.refs.offsets[key] = eval(this.data.refs.offsets[key]) });
    }

    save()
    {
        this.unmapData(this.offsets, this.data, { seriph_step:0x4 });
        this.downloadFile();
    }

    loadData(data, file)
    {
        super.loadData(data, file);
        // Set offsets object to data offsets
        /*
            this.offsets = this.data.refs.offsets;
            this.sortCategory(this.data.refs.inventory);
            this.data.mira = this.readInt(this.data.refs.offsets.mira);
            this.data.new_game = this.readInt(this.data.refs.offsets.new_game);
            this.data.battles = { count:this.readShort(this.data.refs.offsets.battle_count),
                                lost:this.readShort(this.data.refs.offsets.battles_lost),
                                won:this.readShort(this.data.refs.offsets.battles_won),
                                fled:this.readShort(this.data.refs.offsets.battles_fled),
                                };
            this.data.seriph = this.mapArray(this.data.refs.offsets.seriph, [ "earth", "water", "fire", "wind", "time", "space", "mirage", "mass" ], 0x04);
            this.data.line_up = this.mapDataArray(this.readArray(this.data.refs.offsets.line_up, 4, 2), "name", this.data.refs.character_id);
            this.stats = { id:{ base_key:0 }, name:{ base_val:"" }, 
                hp:{ offset:0x0, length:0x4 }, 
                hp_max:{ offset:0x4, length:0x4 },
                ep:{ offset:0x8, length:0x2 },
                ep_max:{ offset:0xA, length:0x2 },
                cp:{ offset:0xC, length:0x2 }, 
                cp_max:{ offset:0x0E, length:0x2 }, 
                level:{ offset:0x24, length:0x2 }, 
                exp:{ offset:0x28, length:0x4 },
                str:{ offset:0x10, length:0x2 },
                def:{ offset:0x12, length:0x2 },
                ats:{ offset:0x14, length:0x2 },
                adf:{ offset:0x16, length:0x2 },
                spd:{ offset:0x18, length:0x2 },
                dex:{ offset:0x1A, length:0x2 },
                agl:{ offset:0x1C, length:0x2 },
                mov:{ offset:0x1E, length:0x2 },
                rng:{ offset:0x20, length:0x2 },
            };
            this.equipment = { id:{ base_key:0 }, name:{ base_val:"" }, 
                weapon:{ offset:0x0, length:0x2 }, 
                armor:{ offset:0x2, length:0x2 }, 
                shoes:{ offset:0x4, length:0x2 }, 
                accessory_1:{ offset:0x6, length:0x2 }, 
                accessory_2:{ offset:0x8, length:0x2 }, 
                costume_1:{ offset:0xA, length:0x2 }, 
                costume_2:{ offset:0xC, length:0x2 }
            };
            this.data.characters = this.readStructArray(this.stats, this.data.refs.offsets.char_data, Object.keys(this.data.refs.character_id).length, 0x50, this.data.refs.character_id);
            this.mergeStructArray(this.data.characters, this.readStructArray(this.equipment, this.data.refs.offsets.equip_data, Object.keys(this.data.refs.character_id).length, 0xE, this.data.refs.character_id));
            this.data.characters.pop();

            this.data.inventory_keys = this.readArray(this.data.refs.offsets.inventory, -1, 0x24, 2, 9999);
            this.data.inventory_counts = this.readArray(this.data.refs.offsets.inventory+0x2, this.data.inventory_keys.length, 0x24, 2);
            this.data.inventory = this.groupArrays(this.data.refs.inventory, this.data.inventory_keys, this.data.inventory_counts);

            this.data.category = this.data.inventory[0];
            this.data.character = this.data.characters[0];*/
    }

    renderTemplate(name, template, data, params)
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
            case "character-equip":
            {
                let field = params[2];
                let items = [];
                let keys = [];
                console.log(field);
                switch (field)
                {
                    case "weapon": 
                    { 
                        keys = [ "Katanas", "Bows", "Canes", "Gauntlets", "Gunswords", "Knight's Swords", "Orbal Staffs", "Pistols", "Rods", "Shotguns", "Spears", "Swords", "Special" ];
                    } break;
                    case "armor":
                    {
                        keys = [ "Armor" ];
                    } break;
                    case "shoes":
                    {
                        keys = [ "Shoes" ];
                    } break;
                    case "accessory_1":
                    case "accessory_2":
                    {
                        keys = [ "Accessories" ];
                    } break;
                    case "costume_1":
                    {
                        keys = [ "Costumes" ];
                    } break;
                    case "costume_2":
                    {
                        keys = [ "Costumes" ];
                    } break;
                }
                let w = data[field];
                let categories = this.data.inventory.filter(e=>keys.indexOf(e.name)!=-1);
                console.log(categories);
                let options = "";
                categories.forEach(cat=>
                    {
                        options += "<optgroup label='"+cat.name+"'>";
                        cat.items.forEach(item=>
                            {
                                let sel = "";
                                if (item.key==w)
                                {
                                    sel = " selected";
                                }
                                options += "<option value='"+item.key+"'"+sel+">"+item.name+"</option>";
                            });
                        options += "</optgroup>";
                    });
                return templates.render(template, { options:options, id:data.id, field:field, title:this.toTitle(field) });
            }
            case "character-link":
                {
                    let index = parseInt(params[2]);
                    // Get any relevant data from the current character
                    let _ti = data.id;
                    let _data = { title:"", index_1:0, index_2:_ti };
                    if (index<_ti)
                    {
                        _data.title = this.data.links.values[index].name;
                        _data.index_1 = _ti;
                        _data.index_2 = index;
                    }
                    else
                    {
                        _data.title = this.data.links.values[index].name;
                        _data.index_1 = index;
                    }
                    if (_data.index_1!=_data.index_2)
                    {
                        out = templates.render(template, _data);
                        return out;
                    }
                    return "";
                 }
            case "character-field":
            {
                let field = params[2];
                let title = this.toTitle(field);
                out = templates.render(template, { name:field, title:title, id:data.id });
                return out;
            }
            case "character-tabs":
            {
                this.data.characters.values.forEach((character, index)=>
                {
                    out += templates.render(template, character, index);
                });
                return out;
            }
            case "character-panel":
                {
                    this.data.characters.values.forEach(char=>
                        {
                            out += templates.render(template, char);
                        })
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