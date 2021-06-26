import { SaveEditorModule } from "../module.js";
import * as m from "./data.js";

class TrailsInTheSkySC extends SaveEditorModule
{
    constructor()
    {
        super();
        this.icon = "./icon.png";
        this.template_file = "../trails_in_the_sky_fc/template.html";
        this.data = m.data;
    }
}

export { TrailsInTheSkySC };