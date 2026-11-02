import path from 'node:path';
import { compile } from 'sass-embedded';
import { packageDirectory } from './sourceScan';

export const stylesheetSourcePath = path.join(packageDirectory, 'src/style.scss');

/** The stylesheet as it ships: style.scss compiled to flat, plain CSS. */
export const compiledStylesheet = compile(stylesheetSourcePath).css;
