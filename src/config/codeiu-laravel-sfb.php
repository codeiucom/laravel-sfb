<?php

$dir = trim('/', env('CODEIU_LARAVEL_SFB_FILE_DIR', ''));
if (empty($dir) || preg_replace('/[^a-zA-Z0-9_-]/', '', $dir) === '') {
    $dir = \CodeIU\LaravelSfb\SfbConsts::FILE_DIR;
}

$mixDir = trim('/', env('CODEIU_LARAVEL_SFB_MIX_FILE_DIR', ''));
if (empty($mixDir) || preg_replace('/[^a-zA-Z0-9_-]/', '', $mixDir) === '') {
    $mixDir = \CodeIU\LaravelSfb\SfbConsts::MIX_FILE_DIR;
}

return [
    'file_dir' => $dir,
    'mix_file_dir' => $mixDir,
    'minify' => env('CODEIU_LARAVEL_SFB_MINIFY', true),
];
