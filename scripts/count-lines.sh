#!/bin/bash

basedir=$(dirname $0)/..

wc -l $(find $basedir -name "*.js" | grep -v node_modules | xargs)

