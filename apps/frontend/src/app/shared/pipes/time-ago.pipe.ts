import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    const date = new Date(value);
    const now  = new Date();
    const secs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secs < 60)      return 'just now';
    if (secs < 3600)    return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400)   return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
    if (secs < 31536000)return `${Math.floor(secs / 2592000)}mo ago`;
    return `${Math.floor(secs / 31536000)}y ago`;
  }
}
