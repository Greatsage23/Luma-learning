import Link from "next/link";

export type InfoSection={heading:string;paragraphs:string[];items?:string[]};

export function InfoPage({eyebrow,title,intro,sections}:{eyebrow:string;title:string;intro:string;sections:InfoSection[]}){
  return <main className="info-page"><nav><Link href="/" className="info-brand"><span>L</span><b>LUMA</b></Link><Link href="/">← Return home</Link></nav><header><span>{eyebrow}</span><h1>{title}</h1><p>{intro}</p></header><section className="info-content">{sections.map(section=><article key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map(text=><p key={text}>{text}</p>)}{section.items&&<ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul>}</article>)}</section><aside className="info-contact"><b>Enrollment is ongoing until 1 September 2026.</b><span>Need assistance? Call <a href="tel:0248274885">0248274885</a> or <a href="tel:0208678734">0208678734</a>.</span></aside></main>
}
