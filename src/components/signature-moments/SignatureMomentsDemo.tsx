import SignatureMoments from './SignatureMoments'
import { demoMoments } from './demo-moments'
import './signature-demo.css'

export default function SignatureMomentsDemo() {
  return <main className="signature-demo">
    <SignatureMoments moments={demoMoments} intro={{ eyebrow: 'COLLECTION / 004 — SIGNATURE MOMENTS', title: 'Some moments\nstay with you.', description: 'Five plays. One story. Scroll to send the first card into the field.' }} />
    <footer className="signature-demo-end"><span>THE COLLECTION CONTINUES</span><h2>Make your own<br /><em>signature moments.</em></h2><p>This section is ready for your stories, images, and films.</p><a href="/">Back to the component lab</a></footer>
  </main>
}
