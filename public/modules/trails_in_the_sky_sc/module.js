import { SaveEditorModule } from "../module.js";
import * as m from "./data.js";

class TrailsInTheSkySC extends SaveEditorModule
{
    constructor()
    {
        super();
        this.icon = "./icon.jpg";
        this.template_file = "../trails_in_the_sky_fc/template.html";
        this.data = m.data;
        this.data.page = "general";
        this.data.inventory = [];
        this.data.line_up = [];
        this.data.characters = [];
        this.data.mira = 0;
        this.data.bp = 0;
        this.data.battles = { count:0, lost:0, won:0, fled:0 };
        this.data.seriph = [];
        //this.debugFile = "sc2.SAV";
        this.offsets = { mira:0x2534C, 
            bp:0x025D44,
                         battle_count:0x26722,
                         battles_lost:0x26722+0x02,
                         battles_won:0x26722+0x04,
                         battles_fled:0x26722+0x06,
                         seriph:0x25354,
                         line_up:0x01F44C-0x20,
                         char_data:0x01F44C,
                         inventory:0x022ECC
                       };
    }

    getMethods()
    {
        return {
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
                data.module_obj.writeInt(data.module_obj.offsets.bp, data.bp);
                data.module_obj.writeShort(data.module_obj.offsets.battle_count, data.battles.count);
                data.module_obj.writeShort(data.module_obj.offsets.battles_lost, data.battles.lost);
                data.module_obj.writeShort(data.module_obj.offsets.battles_won, data.battles.won);
                data.module_obj.writeShort(data.module_obj.offsets.battles_fled, data.battles.fled);
                data.module_obj.writeMapArray(data.module_obj.offsets.seriph, [ "earth", "water", "fire", "wind", "time", "space", "mirage" ], 0x04, data.seriph);
                data.module_obj.writeArray(data.module_obj.offsets.line_up, 4, 4, data.module_obj.unmapDataArray(data.line_up, "id", data.refs.character_id));
                data.module_obj.writeArray(data.module_obj.offsets.char_data, 0x3C, 2, data.char_levels);
                data.module_obj.writeArray(data.module_obj.offsets.char_data, 0x3C, 2, data.module_obj.unmapDataArray(data.characters, "level", data.refs.character_id));
                console.log(data.refs.inventory);
                console.log(data);
                let inv_data = data.module_obj.ungroupArrays(data.refs.inventory, data.inventory_keys, data.inventory_counts, data.inventory);
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
        this.data.bp = this.readInt(this.offsets.bp);
        this.data.battles = { count:this.readShort(this.offsets.battle_count),
                              lost:this.readShort(this.offsets.battles_lost),
                              won:this.readShort(this.offsets.battles_won),
                              fled:this.readShort(this.offsets.battles_fled),
                            };
        this.data.seriph = this.mapArray(this.offsets.seriph, [ "earth", "water", "fire", "wind", "time", "space", "mirage" ], 0x04);
        this.data.line_up = this.mapDataArray(this.readArray(this.offsets.line_up, 4, 4), "name", this.data.refs.character_id);
        this.data.char_levels = this.readArray(this.offsets.char_data, Object.keys(this.data.refs.character_id).length-1, 0x3C, 2);
        //this.data.char_exp = this.readArray(this.offsets.char_data+0xC, 8, 0x34, 4);
        this.data.characters = [];
        let keys = Object.keys(this.data.refs.character_id);
        for (let i=0;i<keys.length;i++)
        {
            if (keys[i]!="255")
            {
                let char = { name:this.data.refs.character_id[keys[i]], id:parseInt(keys[i]), level:this.data.char_levels[i] };
                this.data.characters.push(char);
            }
        }
        this.data.inventory_keys = this.readArray(this.offsets.inventory, -1, 0x4, 2);
        this.data.inventory_counts = this.readArray(this.offsets.inventory+0x2, -1, 0x4, 2);
        this.data.inventory = this.groupArrays(this.data.refs.inventory, this.data.inventory_keys, this.data.inventory_counts);
    }
}

export { TrailsInTheSkySC };