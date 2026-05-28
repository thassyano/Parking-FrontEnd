import { ViewportScroller } from '@angular/common';

export function scrollToTop(scroller: ViewportScroller): void {
  scroller.scrollToPosition([0, 0]);
}
