import { SaveEditorModule } from "../module.js";
import * as m from "./data.js";

class TrailsInTheSkyFC extends SaveEditorModule
{
    constructor()
    {
        super();
        this.icon = "icon.jpg";
        this.template_file = "./template.html";
        this.data = m.data;
        this.data.page = "general";
        this.data.inventory = [];
        this.data.line_up = [];
        this.data.characters = [];
        this.data.mira = 0;
        this.data.bracer_rank = 0;
        this.data.battles = { count:0, lost:0, won:0, fled:0 };
        this.data.seriph = [];
        this.data.char_exp = [];
        //this.debugFile = "SVDAT004.SAV";
        this.offsets = { mira:0x25C88, 
                         bracer_rank:0x25C8C,
                         battle_count:0x266B4,
                         battles_lost:0x266B4+0x02,
                         battles_won:0x266B4+0x04,
                         battles_fled:0x266B4+0x8,
                         seriph:0x025C90,
                         line_up:0x23E38,
                         char_data:0x023E58,
                         inventory:0x024C88
                       };
    }

    getMethods()
    {
        return {
            debug()
            {
                let data = this.$data;
                let inv_data = { keys:[], values:[] };
                for (let i=0;i<1000;i++)
                {
                    inv_data.keys[i] = i;
                    inv_data.values[i] = i;
                }
                data.module_obj.fillData(data.module_obj.offsets.inventory, 0x1000, 0);
                data.module_obj.writeArray(data.module_obj.offsets.inventory, 0x4, 2, inv_data.keys);
                data.module_obj.writeArray(data.module_obj.offsets.inventory+0x2, 0x4, 2, inv_data.values);
                data.module_obj.downloadFile();
                console.log(inv_data);
            },
            switchPage(page)
            {
                const newId = Math.ceil(Math.random() * 1000) + 100;
                this.$vnode.key = newId;
                this.page = page;
            },
            save()
            {
                let data = this.$data;
                data.module_obj.writeInt(data.module_obj.offsets.mira, data.mira);
                data.module_obj.writeInt(data.module_obj.offsets.bracer_rank, data.bracer_rank);
                data.module_obj.writeShort(data.module_obj.offsets.battle_count, data.battles.count);
                data.module_obj.writeShort(data.module_obj.offsets.battles_lost, data.battles.lost);
                data.module_obj.writeShort(data.module_obj.offsets.battles_won, data.battles.won);
                data.module_obj.writeShort(data.module_obj.offsets.battles_fled, data.battles.fled);
                data.module_obj.writeMapArray(data.module_obj.offsets.seriph, [ "earth", "water", "fire", "wind", "time", "space", "mirage" ], 0x04, data.seriph);
                data.module_obj.writeArray(data.module_obj.offsets.line_up, 4, 4, data.module_obj.unmapDataArray(data.line_up, "id", data.refs.character_id));
                let levels = data.module_obj.unmapDataArray(data.characters, "level", data.refs.character_id);
                data.module_obj.writeArray(data.module_obj.offsets.char_data, 0x34, 2, levels);
                for (let i=0;i<levels.length;i++) { levels[i] = (10*((levels[i]+1)*(levels[i]+1)))-1; }
                data.module_obj.writeArray(data.module_obj.offsets.char_data+0xC, 0x34, 2, levels);
                let inv_data = data.module_obj.ungroupArrays(data.refs.inventory, data.inventory);
                data.module_obj.fillData(data.module_obj.offsets.inventory, 0x1000, 0);
                data.module_obj.writeArray(data.module_obj.offsets.inventory, 0x4, 2, inv_data.keys);
                data.module_obj.writeArray(data.module_obj.offsets.inventory+0x2, 0x4, 2, inv_data.values);
                data.module_obj.downloadFile();
            }
        }
    }

    loadFileData(file_data, file_name)
    {
        super.loadFileData(file_data, file_name);
        this.data.mira = this.readInt(this.offsets.mira);
        this.data.bracer_rank = this.readInt(this.offsets.bracer_rank);
        this.data.battles = { count:this.readShort(this.offsets.battle_count),
                              lost:this.readShort(this.offsets.battles_lost),
                              won:this.readShort(this.offsets.battles_won),
                              fled:this.readShort(this.offsets.battles_fled),
                            };
        this.data.seriph = this.mapArray(this.offsets.seriph, [ "earth", "water", "fire", "wind", "time", "space", "mirage" ], 0x04);
        this.data.line_up = this.mapDataArray(this.readArray(this.offsets.line_up, 4, 4), "name", this.data.refs.character_id);
        this.data.char_levels = this.readArray(this.offsets.char_data, 8, 0x34, 2);
        this.data.char_exp = this.readArray(this.offsets.char_data+0xC, 8, 0x34, 4);
        this.data.characters = [];
        let keys = Object.keys(this.data.refs.character_id);
        for (let i=0;i<keys.length;i++)
        {
            if (keys[i]!="255")
            {
                let char = { name:this.data.refs.character_id[keys[i]], id:parseInt(keys[i]), level:this.data.char_levels[i], exp:this.data.char_exp[i] };
                this.data.characters.push(char);
            }
        }
        console.log(this.data.characters);
        this.data.inventory_keys = this.readArray(this.offsets.inventory, -1, 0x4, 2);
        this.data.inventory_counts = this.readArray(this.offsets.inventory+0x2, -1, 0x4, 2);
        this.data.inventory = this.groupArrays(this.data.refs.inventory, this.data.inventory_keys, this.data.inventory_counts);
    }
}

export { TrailsInTheSkyFC };