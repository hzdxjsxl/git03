const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function generateDiskData() {
  return {
    name: 'C:',
    type: 'disk',
    size: 512000,
    children: [
      {
        name: 'Windows',
        type: 'folder',
        size: 200000,
        children: [
          { name: 'System32', type: 'folder', size: 80000, children: [
            { name: 'drivers', type: 'folder', size: 25000, children: [
              { name: 'acpi.sys', type: 'file', size: 5000 },
              { name: 'disk.sys', type: 'file', size: 8000 },
              { name: 'usbport.sys', type: 'file', size: 12000 }
            ]},
            { name: 'config', type: 'folder', size: 30000, children: [
              { name: 'SAM', type: 'file', size: 10000 },
              { name: 'SYSTEM', type: 'file', size: 15000 },
              { name: 'SOFTWARE', type: 'file', size: 5000 }
            ]},
            { name: 'dllcache', type: 'folder', size: 25000, children: [
              { name: 'kernel32.dll', type: 'file', size: 10000 },
              { name: 'user32.dll', type: 'file', size: 8000 },
              { name: 'gdi32.dll', type: 'file', size: 7000 }
            ]}
          ]},
          { name: 'Fonts', type: 'folder', size: 40000, children: [
            { name: 'arial.ttf', type: 'file', size: 8000 },
            { name: 'times.ttf', type: 'file', size: 7000 },
            { name: 'calibri.ttf', type: 'file', size: 6000 },
            { name: 'segoeui.ttf', type: 'file', size: 9000 },
            { name: 'consola.ttf', type: 'file', size: 5000 },
            { name: 'webdings.ttf', type: 'file', size: 5000 }
          ]},
          { name: 'assembly', type: 'folder', size: 50000, children: [
            { name: 'GAC', type: 'folder', size: 30000, children: [
              { name: 'System.dll', type: 'file', size: 12000 },
              { name: 'System.Core.dll', type: 'file', size: 10000 },
              { name: 'System.Data.dll', type: 'file', size: 8000 }
            ]},
            { name: 'NativeImages', type: 'folder', size: 20000, children: [
              { name: 'mscorlib.ni.dll', type: 'file', size: 15000 },
              { name: 'System.ni.dll', type: 'file', size: 5000 }
            ]}
          ]},
          { name: 'winsxs', type: 'folder', size: 30000, children: [
            { name: 'x86_microsoft', type: 'folder', size: 18000, children: [
              { name: 'vc80.crt', type: 'file', size: 10000 },
              { name: 'vc90.crt', type: 'file', size: 8000 }
            ]},
            { name: 'amd64_microsoft', type: 'folder', size: 12000, children: [
              { name: 'vc80.crt', type: 'file', size: 7000 },
              { name: 'vc90.crt', type: 'file', size: 5000 }
            ]}
          ]}
        ]
      },
      {
        name: 'Program Files',
        type: 'folder',
        size: 180000,
        children: [
          { name: 'Microsoft Office', type: 'folder', size: 60000, children: [
            { name: 'Word.exe', type: 'file', size: 20000 },
            { name: 'Excel.exe', type: 'file', size: 18000 },
            { name: 'PowerPoint.exe', type: 'file', size: 15000 },
            { name: 'Outlook.exe', type: 'file', size: 7000 }
          ]},
          { name: 'Google', type: 'folder', size: 50000, children: [
            { name: 'Chrome', type: 'folder', size: 40000, children: [
              { name: 'chrome.exe', type: 'file', size: 20000 },
              { name: 'resources.pak', type: 'file', size: 15000 },
              { name: 'chrome.dll', type: 'file', size: 5000 }
            ]},
            { name: 'Drive', type: 'folder', size: 10000, children: [
              { name: 'googledrive.exe', type: 'file', size: 8000 },
              { name: 'settings.db', type: 'file', size: 2000 }
            ]}
          ]},
          { name: 'Adobe', type: 'folder', size: 40000, children: [
            { name: 'Photoshop.exe', type: 'file', size: 25000 },
            { name: 'Acrobat', type: 'folder', size: 15000, children: [
              { name: 'Acrobat.exe', type: 'file', size: 10000 },
              { name: 'plug_ins', type: 'folder', size: 5000, children: [
                { name: 'PP.api', type: 'file', size: 3000 },
                { name: 'DigSig.api', type: 'file', size: 2000 }
              ]}
            ]}
          ]},
          { name: '7-Zip', type: 'folder', size: 30000, children: [
            { name: '7z.exe', type: 'file', size: 8000 },
            { name: '7zFM.exe', type: 'file', size: 12000 },
            { name: 'Lang', type: 'folder', size: 10000, children: [
              { name: 'zh-cn.txt', type: 'file', size: 4000 },
              { name: 'en.txt', type: 'file', size: 3000 },
              { name: 'ja.txt', type: 'file', size: 3000 }
            ]}
          ]}
        ]
      },
      {
        name: 'Users',
        type: 'folder',
        size: 100000,
        children: [
          { name: 'Administrator', type: 'folder', size: 40000, children: [
            { name: 'Documents', type: 'folder', size: 20000, children: [
              { name: 'report.docx', type: 'file', size: 8000 },
              { name: 'budget.xlsx', type: 'file', size: 7000 },
              { name: 'presentation.pptx', type: 'file', size: 5000 }
            ]},
            { name: 'Downloads', type: 'folder', size: 15000, children: [
              { name: 'installer.exe', type: 'file', size: 10000 },
              { name: 'archive.zip', type: 'file', size: 5000 }
            ]},
            { name: 'Desktop', type: 'folder', size: 5000, children: [
              { name: 'My Computer.lnk', type: 'file', size: 1000 },
              { name: 'Recycle Bin.lnk', type: 'file', size: 1000 },
              { name: 'readme.txt', type: 'file', size: 3000 }
            ]}
          ]},
          { name: 'Public', type: 'folder', size: 30000, children: [
            { name: 'Videos', type: 'folder', size: 15000, children: [
              { name: 'tutorial.mp4', type: 'file', size: 10000 },
              { name: 'demo.mp4', type: 'file', size: 5000 }
            ]},
            { name: 'Music', type: 'folder', size: 10000, children: [
              { name: 'song1.mp3', type: 'file', size: 4000 },
              { name: 'song2.mp3', type: 'file', size: 3000 },
              { name: 'song3.mp3', type: 'file', size: 3000 }
            ]},
            { name: 'Pictures', type: 'folder', size: 5000, children: [
              { name: 'photo1.jpg', type: 'file', size: 2000 },
              { name: 'photo2.jpg', type: 'file', size: 2000 },
              { name: 'photo3.jpg', type: 'file', size: 1000 }
            ]}
          ]},
          { name: 'Guest', type: 'folder', size: 30000, children: [
            { name: 'Projects', type: 'folder', size: 20000, children: [
              { name: 'website', type: 'folder', size: 12000, children: [
                { name: 'index.html', type: 'file', size: 3000 },
                { name: 'style.css', type: 'file', size: 4000 },
                { name: 'app.js', type: 'file', size: 5000 }
              ]},
              { name: 'app', type: 'folder', size: 8000, children: [
                { name: 'main.py', type: 'file', size: 3000 },
                { name: 'utils.py', type: 'file', size: 3000 },
                { name: 'config.json', type: 'file', size: 2000 }
              ]}
            ]},
            { name: 'Temp', type: 'folder', size: 10000, children: [
              { name: 'cache1.tmp', type: 'file', size: 4000 },
              { name: 'cache2.tmp', type: 'file', size: 3000 },
              { name: 'cache3.tmp', type: 'file', size: 3000 }
            ]}
          ]}
        ]
      },
      {
        name: 'ProgramData',
        type: 'folder',
        size: 32000,
        children: [
          { name: 'Microsoft', type: 'folder', size: 15000, children: [
            { name: 'Windows Search', type: 'folder', size: 8000, children: [
              { name: 'index.db', type: 'file', size: 6000 },
              { name: 'config.xml', type: 'file', size: 2000 }
            ]},
            { name: 'Update', type: 'folder', size: 7000, children: [
              { name: 'download.cab', type: 'file', size: 5000 },
              { name: 'pending.xml', type: 'file', size: 2000 }
            ]}
          ]},
          { name: 'Package Cache', type: 'folder', size: 12000, children: [
            { name: 'vc_redist', type: 'folder', size: 7000, children: [
              { name: 'vc_redist.x86.exe', type: 'file', size: 4000 },
              { name: 'vc_redist.x64.exe', type: 'file', size: 3000 }
            ]},
            { name: 'dotnet', type: 'folder', size: 5000, children: [
              { name: 'dotnet-sdk.exe', type: 'file', size: 5000 }
            ]}
          ]},
          { name: 'Oracle', type: 'folder', size: 5000, children: [
            { name: 'Java', type: 'folder', size: 5000, children: [
              { name: 'java.exe', type: 'file', size: 3000 },
              { name: 'javaw.exe', type: 'file', size: 2000 }
            ]}
          ]}
        ]
      }
    ]
  };
}

app.get('/api/disk-data', (req, res) => {
  const path = req.query.path || '';
  let data = generateDiskData();
  
  if (path) {
    const segments = path.split('/').filter(s => s);
    for (const seg of segments) {
      if (data.children) {
        data = data.children.find(c => c.name === seg) || data;
      }
    }
  }
  
  res.json(data);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
