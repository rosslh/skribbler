#! /usr/bin/env python3

# ./release.py -i increment -m "message"

import argparse
import re
from git import Repo
import subprocess


def main(increment, message):
    incrementVersion(increment)
    build()
    commitAndPush(message)


def build():
    subprocess.run("npm run build", shell=True)


def commitAndPush(message):
    repo = Repo("../")
    repo.git.commit('-am', message, author='ross@rosshill.ca')
    repo.git.push('origin', 'master')


def incrementVersion(increment):
    # package.json
    content = ""
    with open('../package.json', 'r') as f:
        content = f.read()
    regex = re.compile(r'"version": "(\d+\.\d+\.\d+)"')
    version = re.search(regex, content).group(1).split('.')
    if increment == "major":
        version[0] = str(int(version[0]) + 1)
    elif increment == "minor":
        version[1] = str(int(version[1]) + 1)
    else:
        version[2] = str(int(version[2]) + 1)
    version = '.'.join(version)
    line = '"version": "{}"'.format(version)
    content = re.sub(regex, line, content)
    with open('../package.json', 'w') as f:
        f.write(content)
    # metadata
    content = ""
    with open('../src/metadata.ts', 'r') as f:
        content = f.read()
    regex = re.compile(r'\/\/ @version \d+\.\d+\.\d+')
    line = '// @version {}'.format(version)
    content = re.sub(regex, line, content)
    with open('../src/metadata.ts', 'w') as f:
        f.write(content)


parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('-i', dest='increment')
parser.add_argument('-m', dest='commitMessage')

main(parser.parse_args().increment, parser.parse_args().commitMessage)
