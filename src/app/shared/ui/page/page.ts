import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { UIPageSize, UIPageSpacing } from '../../types/page.types';

const PAGE_MAX_WIDTH: Record<UIPageSize, string> = {
  narrow: '1080px',
  default: '1180px',
  wide: '1240px',
  'extra-wide': '1320px',
};

const PAGE_SPACING: Record<UIPageSpacing, { padding: string; mobilePadding: string }> = {
  dense: { padding: '36px 28px 80px', mobilePadding: '28px 16px 60px' },
  compact: { padding: '46px 28px 80px', mobilePadding: '32px 16px 60px' },
  default: { padding: '52px 28px 80px', mobilePadding: '34px 16px 60px' },
};

@Component({
  selector: 'app-ui-page',
  templateUrl: './page.html',
  styleUrl: './page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-page',
    '[class.ui-page--stack-tablet]': 'headerStack() === "tablet"',
    '[style.max-width]': 'pageMaxWidth()',
    '[style.padding]': 'pagePadding()',
    '[style.--ui-page-header-margin]': 'headerMargin()',
    '[style.--ui-page-mobile-padding]': 'pageMobilePadding()',
  },
})
export class UIPageComponent {
  readonly header = input(true, { transform: booleanAttribute });
  readonly size = input<UIPageSize>('default');
  readonly spacing = input<UIPageSpacing>('default');
  readonly headerMargin = input('28px');
  readonly headerStack = input<'mobile' | 'tablet'>('mobile');
  readonly pageMaxWidth = computed(() => PAGE_MAX_WIDTH[this.size()]);
  readonly pagePadding = computed(() => PAGE_SPACING[this.spacing()].padding);
  readonly pageMobilePadding = computed(() => PAGE_SPACING[this.spacing()].mobilePadding);
}
