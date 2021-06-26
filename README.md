# SaveEditor
 
### Concept

This app is a generic JavaScript platform to aid in development of client-side save editors. Currently supported natively:
- Trails in The Sky FC

### Creating a module

All modules inheriting from SaveEditorModule require an icon.png, module.js and template.html.

###### SaveEditorModule

The SaveEditorModule class allows for easy creation of new modules within the platform, including multiple tools to help in modification of save files.

- Initialisation

`import { SaveEditorModule } from "../module.js";

class MySaveGameModule extends SaveEditorModule
{
    constructor()
    {
        super();
        this.icon = "./icon.png";
        this.template_file = "./template.html";
	}
}`

This initialisation code will create a very basic plugin. Please see the included modules for more details on functionality.

- Helper Functions

The SaveEditorModule contains basic reading and writing functions.


Both of the default int functions include an optional third parameter that will pass the size of integer (1 for byte, 2 for short, 4 for 32-bit, 8 for 64-bit, etc)

readInt(offset, length, [size=4])
writeInt(offset, value, length, [size=4])

Other reading and writing functions will directly access readInt and writeInt with the appropriate size parameter preset.

readShort(offset, length)
writeShort(offset, length)
readLong(offset, length)
writeLong(offset, length)

More advanced functions include readArray, writeArray, mapDataArray, unmapDataArray, groupArrays and ungroupArrays. There is no documentation at present, although example functionality can be found within the native modules.