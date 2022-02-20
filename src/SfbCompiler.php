<?php

namespace CodeIU\LaravelSfb;

use Illuminate\Support\Facades\Storage;
use Illuminate\View\Compilers\ComponentTagCompiler;
use JSMin\JSMin;

class SfbCompiler extends ComponentTagCompiler
{
    protected string $bladeFilePath;
    protected string $assetsDir = '';
    protected string $sfbFilename = '';
    protected string $sfbCompiledFile = '';

    public function compile($value)
    {
        $this->assetsDir = '/' . config('codeiu-laravel-sfb.file_dir');
        $this->assetsMixDir = '/' . config('codeiu-laravel-sfb.mix_file_dir');

        $this->bladeFilePath = $this->blade->getPath();

        $tmpRegex = preg_quote(base_path(), '/');
        $relationPath = preg_replace('/^' . $tmpRegex . '/', '', $this->bladeFilePath);

        $this->sfbFilename = sha1($relationPath);
        $this->sfbCompiledFile = $this->assetsDir . '/' . $this->sfbFilename;
        $this->sfbCompiledMixFile = $this->assetsMixDir . '/' . $this->sfbFilename;

        // parse
        $replaceText = preg_replace_callback(
            '/@sfb(Mix)?(Script|Style)\(([^)]+)\)(((?!@endSfb).)*)@endSfb/s',
            [$this, 'replaceTextToLink'],
            $value
        );
        if ($replaceText === $value) {
            if (!str_contains($value, '@sfbScript')) {
                $this->deleteFile($this->sfbCompiledFile . '.sfb.js');
            }
            if (!str_contains($value, '@sfbMixScript')) {
                $this->deleteFile($this->sfbCompiledFile . '.mix.sfb.js');
            }
            if (!str_contains($value, '@sfbStyle')) {
                $this->deleteFile($this->sfbCompiledFile . '.sfb.css');
            }
            if (!str_contains($value, '@sfbMixStyle')) {
                $this->deleteFile($this->sfbCompiledFile . '.mix.sfb.css');
            }
        }
        $output = $replaceText;

        return $output;
    }

    protected function replaceTextToLink(array $matches)
    {
        $mixFile = $matches[1];
        $fileType = $matches[2];
        $stackName = $matches[3];
        $matchText = $matches[4] ?? '';

        $linkFilename = $this->sfbCompiledFile . '.sfb';
        $linkMixFilename = $this->sfbCompiledMixFile . '.mix.sfb';

        $output = '';
        $output .= '@push(' . $stackName . ')';
        if ($fileType === "Script") {
            if (empty($mixFile)) {
                $scriptText = $this->parseScript($matchText);
                $fileHash = sha1($scriptText);
                $output .= '<script src="' . $linkFilename . '.js?ver=' . $fileHash . '"></script>';
            } else {
                // laravel mix file hash md5
                $output .= '<script src="{{ mix("' . $linkMixFilename . '.js") }}"></script>';
            }
        } else {
            if (empty($mixFile)) {
                $stypeText = $this->parseStyle($matchText);
                $fileHash = sha1($stypeText);
                $output .= '<link rel="stylesheet" href="' . $linkFilename . '.css?ver= ' . $fileHash . '">';
            } else {
                // laravel mix file hash md5
                $output .= '<link rel="stylesheet" href="{{ mix("' . $linkMixFilename . '.css") }}">';
            }
        }
        $output .= '@endPush';
        return $output;
    }

    protected function parseScript($text)
    {
        preg_match('/<script[^>]*>(.+)<\/script>/si', $text, $script);
        $output = trim($script[1] ?? '');

        if (config('codeiu-laravel-sfb.minify')) {
            $output = JSMin::minify($output);
        }

        $putFilePath = $this->sfbCompiledFile . '.sfb.js';
        $this->saveFile($putFilePath, $output);

        return $output;
    }

    protected function parseStyle($text)
    {
        preg_match('/<style[^>]*>(.+)<\/style>/si', $text, $style);
        $output = trim($style[1] ?? '');

        if (config('codeiu-laravel-sfb.minify')) {
            $output = \Minify_CSSmin::minify($output);
        }

        $putFilePath = $this->sfbCompiledFile . '.sfb.css';
        $this->saveFile($putFilePath, $output);

        return $output;
    }

    protected function saveFile($file, $content)
    {
        $rootPath = public_path();
        $client = Storage::createLocalDriver(['root' => $rootPath]);
        $client->put($file, $content);
    }

    protected function deleteFile($file)
    {
        $rootPath = public_path();
        $client = Storage::createLocalDriver(['root' => $rootPath]);
        $client->delete($file);
    }
}
