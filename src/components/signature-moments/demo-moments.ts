import type { SignatureMoment } from './types'
const folder = '/assets/signature-moments'
export const demoMoments: readonly SignatureMoment[] = [
  { id: 'peach-bowl', title: 'The Peach Bowl', stat: '14 REC · 227 YDS · 4 TD', image: { src: `${folder}/card-01.webp`, width: 1036, height: 1519 }, video: { src: `${folder}/moment-01.mp4` } },
  { id: 'rookie-record', title: 'Single Season Record', stat: '88 REC · 1,400 YDS · 7 TD', image: { src: `${folder}/card-02.webp`, width: 1046, height: 1503 }, video: { src: `${folder}/moment-02.mp4` } },
  { id: 'the-catch', title: 'The Catch', stat: '4TH & 18 · 32-YARD ONE-HANDED GRAB', image: { src: `${folder}/card-03.webp`, width: 1036, height: 1519 }, video: { src: `${folder}/moment-03.mp4` } },
  { id: 'opoy', title: 'Offensive Player of the Year', stat: '128 REC · 1,809 YDS · 8 TD', image: { src: `${folder}/card-04.webp`, width: 1039, height: 1514 }, video: { src: `${folder}/moment-04.mp4` } },
  { id: 'pro-bowl', title: 'Pro Bowl Selection', stat: '4× SELECTION · 2020–2024', image: { src: `${folder}/card-05.webp`, width: 1023, height: 1537 }, video: { src: `${folder}/moment-05.mp4` } },
]
