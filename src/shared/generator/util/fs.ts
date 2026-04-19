import * as fs from 'fs';
import * as path from 'path';

export interface WriteFileOptions {
    overwrite?: boolean;
    log?: boolean;
}

/**
 * 确保目录存在
 */
export function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * 安全写文件（生成器统一出口）
 */
export function writeFileSafe(
    filePath: string,
    content: string,
    options: WriteFileOptions = {},
) {
    const { overwrite = false, log = true } = options;

    ensureDir(path.dirname(filePath));

    if (fs.existsSync(filePath) && !overwrite) {
        log && console.log(`[skip] ${filePath}`);
        return;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    log && console.log(`[generate] ${filePath}`);
}
