import prompts from 'prompts';
import fs from 'fs-extra';
import path from 'node:path';
import crypto from 'node:crypto';

type Recordable = Record<string, unknown>;

interface Manifest {
  packageUrl: string;
  remoteManifestUrl: string;
  remoteVersionUrl: string;
  version: string;
}

interface Project {
  assets: Recordable;
  searchPaths: string[];
}

const pkg = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));

function normalizeUrl(url: string): string {
  // Replace multiple consecutive slashes with a single slash, but keep 'http://' or 'https://' intact
  return url.replace(/([^:]\/)\/+/g, '$1');
}

function readDir(source: string, dir: string, obj: Recordable) {
  try {
    const checkStat = fs.statSync(dir);
    if (!checkStat.isDirectory()) {
      return;
    }

    const children = fs.readdirSync(dir);
    for (let i = 0; i < children.length; ++i) {
      if (children[i][0] === '.') {
        continue;
      }

      const child = path.join(dir, children[i]);
      const stat = fs.statSync(child);
      if (stat.isDirectory()) {
        readDir(source, child, obj);
      } else if (stat.isFile()) {
        // Size in Bytes
        const size = stat['size'];
        const md5 = crypto.createHash('md5').update(fs.readFileSync(child)).digest('hex');
        const compressed = path.extname(child).toLowerCase() === '.zip';

        const relative = encodeURI(path.relative(source, child).replace(/\\/g, '/'));
        obj[relative] = {
          size: size,
          md5: md5,
          ...(compressed && {
            compressed: true,
          }),
        };
      }
    }
  } catch (err) {
    console.error('[readDir]', err);
  }
}

(async () => {
  const manifest: Manifest = {
    packageUrl: 'http://localhost/remote-assets/',
    remoteManifestUrl: 'http://localhost/remote-assets/project.manifest',
    remoteVersionUrl: 'http://localhost/remote-assets/version.manifest',
    version: '1.0.0',
  };

  const project: Project = {
    assets: {},
    searchPaths: [],
  };

  const { url, version, source, dest } = await prompts([
    {
      type: 'text',
      name: 'url',
      message: '请输入远程地址:',
      initial: 'http://localhost:9600/remote-assets/',
    },
    {
      type: 'text',
      name: 'version',
      message: '请输入远程版本 (格式 x.y.z):',
      initial: pkg.version,
      validate: (value: string) => /^\d+\.\d+\.\d+$/.test(value),
    },
    {
      type: 'text',
      name: 'source',
      message: '请输入资源目录:',
      initial: './build/android/data',
    },
    {
      type: 'text',
      name: 'dest',
      message: '请输入输出目录:',
      initial: './assets/',
    },
  ]);

  // setup
  manifest.packageUrl = url;
  manifest.remoteManifestUrl = normalizeUrl(`${url}/project.manifest`);
  manifest.remoteVersionUrl = normalizeUrl(`${url}/version.manifest`);
  manifest.version = version;

  // 生成资源文件列表
  readDir(source, path.join(source, 'src'), project.assets);
  readDir(source, path.join(source, 'assets'), project.assets);
  readDir(source, path.join(source, 'jsb-adapter'), project.assets);

  // 确保目录存在
  fs.ensureDirSync(dest);

  const destManifest = path.join(dest, 'project.manifest');
  const destVersion = path.join(dest, 'version.manifest');

  fs.writeFileSync(destManifest, JSON.stringify({ ...manifest, ...project }, null, 2));
  console.log('[Main]', 'Manifest successfully generated');

  fs.writeFileSync(destVersion, JSON.stringify(manifest, null, 2));
  console.log('[Main]', 'Version successfully generated');
})();
