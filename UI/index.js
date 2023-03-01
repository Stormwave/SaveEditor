const path = require('path')
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const { getSteamPath } = require('steam-game-path');

const createWindow = () => {
    const win = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });

    ipcMain.on('upload', (event, paths, ext) => 
    {
        let steamPath = getSteamPath().replace(/\\/g, "/");
        // Find any possible file locations
        let found = false;

        paths.forEach(_path=>
            {
                _path = _path.replace(/\\/g, "/")
                _path = _path.replace(/\%UserProfile\%/g, os.homedir());
                if (_path.indexOf("%SteamUserProfile%")!=-1)
                {
                  // Find any possible user data folder
                  fs.readdirSync(steamPath+"/userdata").forEach(_d=>
                  {
                      if (_d!="0" && !isNaN(parseInt(_d)) && !found)
                      {
                        let _p = _path.replace(/\%SteamUserProfile\%/g, steamPath+"/userdata/"+_d);
                        if (fs.existsSync(_p))
                        {
                          fs.readdirSync(_p).forEach(_f=>
                            {
                              if (_f.length>ext.length+1 && _f.substr(_f.length-ext.length-1).toLowerCase()=="."+ext.toLowerCase())
                              {
                                found = true;
                                _path = _p;
                              }
                            });
                        }
                      }
                  });
                }
                if (!found)
                {
                  fs.readdirSync(_path).forEach(_f=>
                  {
                    if (!found && _f.length>ext.length+1 && _f.substr(_f.length-ext.length-1).toLowerCase()=="."+ext.toLowerCase())
                    {
                      found = true;
                    }
                  });
                }
                if (found)
                {
                  console.log(_path);
                  dialog.showOpenDialogSync(win, {
                    properties: ['openFile'],
                    defaultPath:_path.replace(/\//g, "\\"),
                    filters:
                    [
                      { name: 'Save Files', extensions: [ ext ] },
                    ]
                  })
                }
            });
    })
  
    // Build line
    win.loadFile(path.join(__dirname, 'public/index.html'));
  }

  app.whenReady().then(() => {
    createWindow()
  })