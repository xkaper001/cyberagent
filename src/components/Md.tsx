import React from 'react';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export const Md: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const html = marked.parse(text || '', { async: false }) as string;
  return <div className={`md ${className || ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
};
