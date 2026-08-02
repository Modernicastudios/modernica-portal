'use client'

import { useState } from 'react'
import { X, User, Briefcase, Euro, Trophy, MessageSquare, HelpCircle, Rocket } from 'lucide-react'

type Tab = 'wie' | 'wat' | 'prijzen' | 'cases' | 'openers' | 'bezwaren' | 'afsluiter'

export default function ScriptPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('wie')

  const tabs: Array<{ key: Tab; label: string; icon: any }> = [
    { key: 'wie', label: 'Wie zijn we', icon: <User size={14} /> },
    { key: 'wat', label: 'Wat we doen', icon: <Briefcase size={14} /> },
    { key: 'prijzen', label: 'Prijzen', icon: <Euro size={14} /> },
    { key: 'cases', label: 'Cases', icon: <Trophy size={14} /> },
    { key: 'openers', label: 'Openers', icon: <MessageSquare size={14} /> },
    { key: 'bezwaren', label: 'Bezwaren', icon: <HelpCircle size={14} /> },
    { key: 'afsluiter', label: 'Afsluiter', icon: <Rocket size={14} /> },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        background: 'white', width: '100%', maxWidth: 520, height: '100%',
        display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7E2F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5F5A72', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cold Call Script</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Modernica Studios</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#5F5A72' }}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs — horizontal scroll */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #E7E2F4', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              marginRight: 6, borderRadius: 100, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#3F06E3' : '#F6F3FF',
              color: tab === t.key ? 'white' : '#3F06E3',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content — scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {tab === 'wie' && <SectionWie />}
          {tab === 'wat' && <SectionWat />}
          {tab === 'prijzen' && <SectionPrijzen />}
          {tab === 'cases' && <SectionCases />}
          {tab === 'openers' && <SectionOpeners />}
          {tab === 'bezwaren' && <SectionBezwaren />}
          {tab === 'afsluiter' && <SectionAfsluiter />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONTENT SECTIES
// ═══════════════════════════════════════════════════════════════

function SectionWie() {
  return (
    <div>
      <h3 style={headerStyle}>Wie is Modernica Studios</h3>
      <Card>
        <p><strong>Een creative studio uit Noord-Holland</strong>, gestart door Sjoerd Bom + Maartje.</p>
        <p>We doen <strong>volledige online zichtbaarheid voor MKB-bedrijven</strong>: websites, social, video, content en leadgeneratie.</p>
        <p>Niet een bureau met veel schakels — een team dat direct meedenkt vanuit jullie doelen.</p>
      </Card>

      <h4 style={subHeaderStyle}>Belangrijkste punten om te noemen</h4>
      <Bullets items={[
        'Gevestigd in Santpoort-Noord',
        'Geen 12-maanden contracten — kort proberen, verlengen als het werkt',
        'Werken op maat: van kleine websites tot volledige marketing-uitbesteding',
        'Alles onder één dak: strategie, ontwerp, tekst, foto, video, ads',
      ]} />
    </div>
  )
}

function SectionWat() {
  return (
    <div>
      <h3 style={headerStyle}>Wat we bieden</h3>
      <Service title="Websites" desc="Van simpele onepagers tot volledige project-sites. Voor MKB die meer aanvragen of reserveringen via Google wil." />
      <Service title="Social media" desc="Instagram, LinkedIn, TikTok. Consistent goede posts + video-content dat écht opvalt." />
      <Service title="Video &amp; foto" desc="Product-video, sfeer, bedrijfsverhaal, testimonials. Kwaliteit die past bij jullie merk." />
      <Service title="Online marketing" desc="Meta + Google ads, landing pages per doelgroep, conversie-optimalisatie." />
      <Service title="Content per branche" desc="Contentkalender + productie op maat voor jullie niche. Bijv. horeca of bouw." />
    </div>
  )
}

function SectionPrijzen() {
  return (
    <div>
      <h3 style={headerStyle}>Prijzen (echt — eerlijk noemen wanneer gevraagd)</h3>
      <p style={{ fontSize: 13, color: '#5F5A72', marginBottom: 16 }}>
        Noem prijzen als de klant er expliciet naar vraagt. Anders eerst doorvragen naar behoefte en aanbieden om vrijblijvend voorstel te maken. Bijna alles is uiteindelijk maatwerk.
      </p>

      <PriceBlock title="Websites — bouw eenmalig">
        <li><strong>€750</strong> — Onepager, simpele professionele site voor kleine ondernemer</li>
        <li><strong>€1.200 – €2.000</strong> — Gemiddeld MKB-project met meerdere pagina&apos;s</li>
        <li><strong>€3.000 – €5.000</strong> — Complex project, webshop, maatwerk</li>
      </PriceBlock>

      <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
        <strong style={{ color: '#065F46' }}>✓ Standaard erin (alle projecten):</strong>
        <ul style={{ paddingLeft: 18, marginTop: 6, lineHeight: 1.6 }}>
          <li>Design (mockups + revisies)</li>
          <li>Ontwikkeling &amp; bouw</li>
          <li>Copywriting</li>
          <li>Google Analytics setup</li>
          <li>1 maand support na livegang</li>
          <li>Klant regelt eigen domein</li>
        </ul>
      </div>

      <PriceBlock title="SEO (er komt keuze)">
        <li><strong>+€250</strong> — Basis SEO: meta tags + structuur + juiste headings</li>
        <li><strong>+€250 extra</strong> — Uitgebreide SEO: keyword research + geoptimaliseerde content</li>
        <li><strong>€150 – €200 per kwartaal</strong> — Doorlopend SEO onderhoud (verwerkt in verkooppitch, zie tab &quot;Openers&quot;)</li>
      </PriceBlock>

      <PriceBlock title="Hosting + beheer">
        <li>Wordt per kwartaal gefactureerd</li>
        <li>Prijs op basis van: alleen hosting, of met CMS-dashboard, of WordPress-hosting</li>
        <li>Met CMS-dashboard = kleine meerprijs in hosting; klant kan zelf teksten &amp; foto&apos;s aanpassen</li>
        <li>Zonder dashboard = wij maken updates op verzoek</li>
      </PriceBlock>

      <PriceBlock title="Foto&apos;s en video&apos;s (optioneel)">
        <li><strong>Eerst</strong> gebruiken we bestaand beeldmateriaal van de klant</li>
        <li>Geen materiaal? Dan tijdelijk stock of klant-foto&apos;s</li>
        <li>Later kunnen wij zelf foto&apos;s en video&apos;s maken — extra kosten, altijd op maat</li>
        <li>Voordeel: alles onder één dak, we kennen jouw merk al</li>
      </PriceBlock>

      <div style={{ padding: 14, background: '#FEF3C7', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
        <strong style={{ color: '#92400E' }}>💰 Betaling — helder en gebruikelijk:</strong>
        <ul style={{ paddingLeft: 18, marginTop: 6, lineHeight: 1.6 }}>
          <li><strong>50% vooraf, 50% bij oplevering</strong></li>
          <li>Contract wordt getekend voor start</li>
          <li>We beginnen pas nadat de eerste betaling binnen is</li>
          <li>Geen 12-maanden contracten. Kort beginnen, verlengen als het werkt.</li>
        </ul>
      </div>

      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 10, marginTop: 14, fontSize: 13 }}>
        <strong style={{ color: '#3F06E3' }}>💡 Waarom SEO abonnement handig is (te zeggen tijdens gesprek):</strong>
        <p style={{ marginTop: 8, lineHeight: 1.5 }}>
          &quot;Google verandert continu z&apos;n regels. Eén keer optimaliseren is prima voor start, maar zonder onderhoud zak je binnen 6 maanden weer. Voor €150–€200 per kwartaal houden we je pagina&apos;s bovenaan: nieuwe keywords, content updates, technische checks. Bedrijven die dit wel doen groeien vaak 2–3× meer aanvragen per jaar dan die het niet doen.&quot;
        </p>
      </div>
    </div>
  )
}

function SectionCases() {
  return (
    <div>
      <h3 style={headerStyle}>Cases &amp; resultaten (echte cijfers, echte klanten)</h3>
      <p style={{ fontSize: 13, color: '#5F5A72', marginBottom: 16 }}>
        Gebruik de case die past bij de branche van de lead. Alleen echt gebeurde cijfers noemen. Blijf eerlijk.
      </p>

      <CaseBlock name="Kunststofhuis Waterland" branche="Industrie / groothandel" color="#F97316">
        <p><strong>Voor:</strong> geen aanvragen via de site, klanten kwamen alleen via bestaande relaties.</p>
        <p><strong>Wat we deden:</strong> hele website vernieuwd, duidelijker propositie en aanvraagformulier.</p>
        <p><strong>Resultaat:</strong> van <strong>0 aanvragen/mnd</strong> naar <strong>7+ aanvragen/mnd</strong> in de eerste 2 maanden na livegang. Dat blijft groeien.</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>Gebruik bij: bouwbedrijven, industrieel, groothandel, aannemers, fabrikanten.</p>
      </CaseBlock>

      <CaseBlock name="Bierbrasserie Koster" branche="Horeca" color="#EF4444">
        <p><strong>Voor:</strong> geen digitale zichtbaarheid, geen reserveringen via de site voor groepen.</p>
        <p><strong>Wat we deden:</strong> betere online presentatie + reserverings-integratie voor groepsaanvragen.</p>
        <p><strong>Resultaat:</strong> van vrijwel <strong>0 groepsreserveringen via de site</strong> naar <strong>1–3 grote groepen (20+ personen) per maand</strong>. Groeit door.</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>Gebruik bij: restaurants, cafés, hotels, brasserieën, event-locaties.</p>
      </CaseBlock>

      <CaseBlock name="StudyBridge.nl" branche="Recruitment / detachering" color="#3F06E3">
        <p><strong>Voor:</strong> traditionele wervingsaanpak liep vast bij snelle groei.</p>
        <p><strong>Wat we deden:</strong> volledig recruitment-marketing pakket — nieuwe site + personeelswerving-ads bedacht, geplaatst en beheerd.</p>
        <p><strong>Resultaat:</strong> <strong>400+ kwalitatieve leads en 60 plaatsingen in 6 maanden</strong>. Kosten per hire ongeveer gehalveerd.</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>Belangrijk: dit was met ads + volledige campagne, niet alleen een website. Gebruik bij: recruitment, HR, uitzendbureaus.</p>
      </CaseBlock>

      <CaseBlock name="Stut Productions" branche="Fotografie" color="#8B5CF6">
        <p><strong>Voor:</strong> onoverzichtelijke portfolio-site, foto-kwaliteit kwam niet tot z&apos;n recht.</p>
        <p><strong>Wat we deden:</strong> volledige nieuwe website met behoud van foto-kwaliteit, contactformulieren en een <strong>prijs-calculator</strong> zodat mensen meteen kunnen inzien wat een shoot kost.</p>
        <p><strong>Resultaat:</strong> oplopende aanvragen + meer lokale bezoekers dankzij goede SEO.</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>Gebruik bij: creative studios, fotografen, coaches, dienstverleners met visueel werk.</p>
      </CaseBlock>

      <CaseBlock name="Lumi's" branche="Restaurant (nieuw)" color="#EC4899">
        <p><strong>Voor:</strong> net begonnen, geen enkele online aanwezigheid.</p>
        <p><strong>Wat we deden:</strong> volledige website vanaf nul opgebouwd. Eigen foto&apos;s komen er nog aan.</p>
        <p><strong>Resultaat:</strong> live, cijfers volgen nog. Eerste maanden zichtbaarheid vergroten is prioriteit.</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>Gebruik bij: nieuwe ondernemers, starters, restaurants in opstartfase.</p>
      </CaseBlock>

      <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, marginTop: 14, fontSize: 13, color: '#065F46' }}>
        <strong>Andere klanten die je kan noemen als reference:</strong> De LED Installateur, Nabestaandenzorg (contentstrategie), diverse MKB in Noord-Holland.
      </div>
    </div>
  )
}

function SectionOpeners() {
  return (
    <div>
      <h3 style={headerStyle}>Openings-scripts</h3>
      <p style={{ fontSize: 13, color: '#5F5A72', marginBottom: 16 }}>
        Kies opener op basis van hun context (mail al gehad, warm ijs, geheel koud).
      </p>

      <OpenerBlock title="Wanneer ze WEL onze mail hebben gehad (staat in de lead)">
        <p>&quot;Hoi, met [Naam] van Modernica Studios. Ik bel je omdat we je een tijdje terug een mailtje hebben gestuurd over jullie online zichtbaarheid — heb je dat gezien?&quot;</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 8 }}><em>Als ja:</em> &quot;Mooi, ik was benieuwd of er iets in speelde — willen jullie iets doen aan de website of social?&quot;</p>
        <p style={{ fontSize: 12, color: '#5F5A72' }}><em>Als nee:</em> &quot;Geen probleem, sowieso even in het kort: wij helpen [branche] met [waarde]. Speelt er iets rondom [pijnpunt]?&quot;</p>
      </OpenerBlock>

      <OpenerBlock title="Wanneer hun website er verouderd uitziet">
        <p>&quot;Hoi, met [Naam] van Modernica. Ik kwam jullie website tegen en zag dat het misschien tijd is voor een refresh — is dat iets waar jullie mee bezig zijn?&quot;</p>
      </OpenerBlock>

      <OpenerBlock title="Wanneer ze een nieuwe/goede site hebben (switch pitch)">
        <p>&quot;Hoi, met [Naam] van Modernica. Site ziet er top uit trouwens. Ik was benieuwd — is de volgende stap voor jullie meer online zichtbaarheid via social of misschien personeelswerving?&quot;</p>
      </OpenerBlock>

      <OpenerBlock title="Neutrale/koude opener">
        <p>&quot;Hoi, met [Naam] van Modernica Studios uit Noord-Holland. Wij helpen MKB-bedrijven met hun online zichtbaarheid — kan ik je een korte vraag stellen?&quot;</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 8 }}><em>Als ja:</em> stel jouw vraag over hun huidige situatie.</p>
      </OpenerBlock>
    </div>
  )
}

function SectionBezwaren() {
  return (
    <div>
      <h3 style={headerStyle}>Veel gehoorde bezwaren + antwoorden</h3>

      <Objection q="&quot;We hebben al een bureau&quot;">
        <p><strong>Reactie:</strong> &quot;Snap ik. Ik vraag me af of alles daar loopt zoals je hoopt — als er ooit iets is waar het niet loopt, mag ik dan bellen? Anders staan we in de contactenlijst.&quot;</p>
      </Objection>

      <Objection q="&quot;We hebben geen budget&quot;">
        <p><strong>Reactie:</strong> &quot;Snap ik. We kunnen ook klein beginnen — vanaf €750 voor een simpele site, of vanaf €1.250/mnd voor content. Of losse projecten. Waar denk je aan qua investering?&quot;</p>
      </Objection>

      <Objection q="&quot;Niet geïnteresseerd&quot;">
        <p><strong>Reactie:</strong> &quot;Geen probleem. Mag ik heel kort vragen: is dat omdat het nu niet speelt, of hebben jullie hier iemand voor?&quot;</p>
        <p style={{ fontSize: 12, color: '#5F5A72', marginTop: 6 }}>→ Als iemand voor: check op switch (nieuwe niche). Als niet speelt: over een paar maanden opnieuw contact.</p>
      </Objection>

      <Objection q="&quot;Stuur maar informatie op&quot;">
        <p><strong>Reactie:</strong> &quot;Dat doe ik graag, maar helpt me als ik weet wat aansluit. Kort: hebben jullie interesse in website, social, video, of eerder brede marketing?&quot;</p>
      </Objection>

      <Objection q="&quot;We doen alles zelf&quot;">
        <p><strong>Reactie:</strong> &quot;Cool, veel bedrijven doen dat. Ik ben benieuwd — waar loop je dan het meeste tegenaan qua tijd of resultaat? Misschien kunnen we juist DAAR bij helpen.&quot;</p>
      </Objection>

      <Objection q="&quot;We hebben net iemand aangenomen&quot;">
        <p><strong>Reactie:</strong> &quot;Top, veel succes! Als het je collega ooit helpt om externe support te hebben — bijv. video-productie of grote projecten — hoor ik het graag.&quot;</p>
      </Objection>
    </div>
  )
}

function SectionAfsluiter() {
  return (
    <div>
      <h3 style={headerStyle}>Afsluiten — wat vragen, wat plannen</h3>

      <div style={{ padding: 16, background: '#F1ECFF', borderRadius: 12, marginBottom: 16 }}>
        <strong style={{ color: '#3F06E3', fontSize: 14 }}>🎯 Best case: kennismakingsgesprek plannen (30 min video)</strong>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          &quot;Klinkt goed. Dan plan ik een half uurtje met Sjoerd of Maartje in — zij nemen samen met jou de aanpak door en maken daarna een echt voorstel op maat. Past dinsdag 10:00 of donderdag 14:00 beter?&quot;
        </p>
        <ol style={{ marginTop: 12, paddingLeft: 20, fontSize: 13, lineHeight: 1.6 }}>
          <li>Geef 2 concrete tijdopties (nooit &quot;wanneer past het jou&quot; als opener)</li>
          <li>Bevestig binnen 5 min per mail met Google Meet link</li>
          <li>Log in CRM: outcome <em>gesprek_ingepland</em> + datum</li>
        </ol>
      </div>

      <div style={{ padding: 16, background: '#F0FDF4', borderRadius: 12, marginBottom: 16 }}>
        <strong style={{ color: '#065F46', fontSize: 14 }}>💡 Warm maar niet klaar: gratis preview toezeggen</strong>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          &quot;Weet je wat, ik kan je binnen een week een gratis basis-preview mailen van hoe wij jouw site zouden aanpakken. Zo zie je meteen ons stijl en tempo, zonder verplichting. Wat is je e-mailadres?&quot;
        </p>
        <p style={{ marginTop: 6, fontSize: 12, color: '#065F46' }}>→ Log outcome <em>preview_gevraagd</em>. Sjoerd/Maartje maakt binnen 3 werkdagen.</p>
      </div>

      <div style={{ padding: 16, background: '#FEF3C7', borderRadius: 12, marginBottom: 16 }}>
        <strong style={{ color: '#92400E', fontSize: 14 }}>⏰ Nog niet nu maar later: callback plannen</strong>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          &quot;Prima, wanneer past het je beter? Over een paar weken of pas na een specifiek moment (bijv. na vakantie, nieuw kwartaal)?&quot;
        </p>
        <p style={{ marginTop: 6, fontSize: 12, color: '#92400E' }}>→ Log outcome <em>callback_gevraagd</em> + zet EXACTE datum in de callback velden.</p>
      </div>

      <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 12, marginBottom: 16 }}>
        <strong style={{ color: '#991B1B', fontSize: 14 }}>❌ Niet interessant of afwijzing</strong>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          &quot;Geen probleem, bedankt voor je tijd! Als het ooit anders wordt, weet je waar je ons kan vinden. Prettige dag verder.&quot;
        </p>
        <p style={{ marginTop: 6, fontSize: 12, color: '#991B1B' }}>→ Log <em>niet_geinteresseerd</em>. Blijft altijd vriendelijk — je weet nooit later.</p>
      </div>

      <div style={{ padding: 16, background: '#F6F3FF', borderRadius: 12, marginTop: 20 }}>
        <strong style={{ color: '#3F06E3', fontSize: 14 }}>⚡ Wat gebeurt er nu als de klant JA zegt (proces)</strong>
        <ol style={{ marginTop: 10, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
          <li><strong>Kennismakingsgesprek</strong> (30 min video) — Sjoerd of Maartje neemt behoefte door</li>
          <li><strong>Voorstel op maat</strong> — binnen 3–5 werkdagen krijg je een concreet voorstel + prijs</li>
          <li><strong>Getekend contract</strong> — 50% aanbetaling; we starten pas nadat die binnen is</li>
          <li><strong>Design fase</strong> — mockups + revisierondes (afhankelijk van scope 1–2 weken)</li>
          <li><strong>Bouw fase</strong> — website wordt gebouwd (1–3 weken voor simpel; langer voor complex)</li>
          <li><strong>Test + livegang</strong> — samen doorlopen, feedback verwerken</li>
          <li><strong>Livegang + oplevering</strong> — laatste 50% betaling</li>
          <li><strong>1 maand nazorg standaard</strong> — bugs, kleine tweaks</li>
        </ol>
        <p style={{ marginTop: 10, fontSize: 12, color: '#5F5A72' }}>Voor een simpele onepager: totaal ~2–4 weken vanaf getekend contract tot live. Complexer: 6–12 weken.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const headerStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12,
}
const subHeaderStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginTop: 18, marginBottom: 8,
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#F6F3FF', borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.6 }}>{children}</div>
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginTop: 8, fontSize: 13, lineHeight: 1.7 }}>
      {items.map((i, idx) => <li key={idx}>{i}</li>)}
    </ul>
  )
}

function Service({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ padding: 14, border: '1px solid #E7E2F4', borderRadius: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#5F5A72', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  )
}

function PriceBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</div>
      <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>{children}</ul>
    </div>
  )
}

function CaseBlock({ name, branche, color, children }: any) {
  return (
    <div style={{ padding: 14, borderRadius: 12, marginBottom: 12, borderLeft: `4px solid ${color}`, background: 'white', border: '1px solid #E7E2F4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <strong style={{ fontSize: 15 }}>{name}</strong>
        <span style={{ fontSize: 11, color: '#5F5A72', fontWeight: 600 }}>{branche}</span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#1A1730' }}>{children}</div>
    </div>
  )
}

function OpenerBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 14, background: '#F6F3FF', borderRadius: 10, marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#3F06E3', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>{children}</div>
    </div>
  )
}

function Objection({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 14, background: 'white', border: '1px solid #E7E2F4', borderRadius: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: q }} />
      <div style={{ fontSize: 13, lineHeight: 1.55, color: '#5F5A72' }}>{children}</div>
    </div>
  )
}
