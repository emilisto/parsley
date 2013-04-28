#!/bin/bash

basedir=$(dirname $0)/..

wc -l $(find $basedir/{tmp,example,lib} -name "*.js" | xargs)

