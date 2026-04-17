import type { Language } from './i18n'
import type { ServiceRecommendation } from '../types/domain'

const CATEGORY_LABEL_VI: Record<ServiceRecommendation['category'], string> = {
  oil: 'Dau may',
  tires: 'Lop xe',
  battery: 'Ac quy',
  inspection: 'Kiem tra tong quat',
  cleaning: 'Ve sinh',
}

function localizeByCategory(category: ServiceRecommendation['category']) {
  if (category === 'oil') {
    return {
      title: 'Thay dau va loc dau tong hop',
      description: 'Nen xu ly som de bao ve dong co va giu xe van hanh on dinh khi di trong do thi.',
      issue: 'Chu ky thay dau dang toi han so voi moc bao duong khuyen nghi.',
      impact: 'Tri hoan co the lam tang mai mon dong co va giam hieu suat nhien lieu.',
      actionLabel: 'Dat lich thay dau',
    }
  }
  if (category === 'battery') {
    return {
      title: 'Kiem tra tinh trang ac quy',
      description: 'Nen test ac quy de tranh tinh huong xe kho de hoac khong de duoc.',
      issue: 'Ac quy co dau hieu suy giam do tan suat di ngan va dung cho cao.',
      impact: 'Phat hien som se re hon thay ac quy khan cap.',
      actionLabel: 'Dat lich kiem tra ac quy',
    }
  }
  if (category === 'tires') {
    return {
      title: 'Kiem tra ap suat va can chinh lop',
      description: 'Can kiem tra som de giu do bam duong va keo dai tuoi tho lop xe.',
      issue: 'Do mon lop chua deu va can kiem tra can bang lai.',
      impact: 'Lop mon khong deu co the anh huong den an toan va muc tieu hao.',
      actionLabel: 'Dat lich kiem tra lop',
    }
  }
  return {
    title: 'Can xu ly bao duong',
    description: 'Nen xu ly som de giu xe van hanh on dinh va an toan.',
    issue: 'He thong dang ghi nhan mot muc can theo doi.',
    impact: 'Xu ly dung luc giup tranh phat sinh chi phi lon hon.',
    actionLabel: 'Dat lich dich vu',
  }
}

export function localizeRecommendation(recommendation: ServiceRecommendation, language: Language): ServiceRecommendation {
  if (language !== 'vi') return recommendation
  const localized = localizeByCategory(recommendation.category)

  return {
    ...recommendation,
    category: recommendation.category,
    title: localized.title,
    description: localized.description,
    issue: localized.issue,
    impact: localized.impact,
    actionLabel: localized.actionLabel,
  }
}

export function localizeCategoryLabel(category: ServiceRecommendation['category'], language: Language): string {
  if (language !== 'vi') {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }
  return CATEGORY_LABEL_VI[category]
}
