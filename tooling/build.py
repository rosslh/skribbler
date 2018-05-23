#! /usr/bin/env python3
import shutil
import os
import subprocess

def main():
    buildES5()
    buildES6()
    buildAdmin()


def buildES5():
    resetTmp()
    concatFiles("src/source.ts", "src/notAdmin.ts", "src/tmp/1.ts")
    compileTs(["src/tmp/1.ts", "src/globals.d.ts"], "ES5", "src/tmp/2.js")
    concatFiles("src/metadata.ts", "src/tmp/2.js", "dist/ES5.user.js")
    rmTmp()


def buildES6():
    resetTmp()
    concatFiles("src/source.ts", "src/notAdmin.ts", "src/tmp/1.ts")
    compileTs(["src/tmp/1.ts", "src/globals.d.ts"], "ES2016", "src/tmp/2.js")
    concatFiles("src/metadata.ts", "src/tmp/2.js", "dist/skribbler.user.js")
    rmTmp()


def buildAdmin():
    if(os.path.exists("src/admin.ts")):
        resetTmp()
        concatFiles("src/source.ts", "src/admin.ts", "src/tmp/1.ts")
        compileTs(["src/tmp/1.ts", "src/globals.d.ts"], "ES2016", "src/tmp/2.js")
        concatFiles("src/metadata.ts", "src/tmp/2.js", "dist/admin.user.js")
        rmTmp()


def compileTs(files, target, out):
    subprocess.run("tsc {} -t {} --outFile {}".format(' '.join(files), target, out), shell=True)


def concatFiles(file1, file2, out):
    with open(file1) as f1:
        with open(file2) as f2:
            with open(out, 'w+') as o:
                o.write(f1.read() + f2.read())


def resetTmp(directory = "src/tmp"):
    rmTmp(directory)
    os.makedirs(directory)


def rmTmp(directory="src/tmp"):
    if os.path.exists(directory):
        if os.path.isdir(directory):
            shutil.rmtree(directory)
        else:
            os.remove(directory)


if __name__ == "__main__":
    main()
