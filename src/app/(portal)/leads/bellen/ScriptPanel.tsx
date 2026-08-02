'use client'

import { useState } from 'react'
import { X, User, Briefcase, Euro, Trophy, MessageSquare, HelpCircle, Rocket, Target } from 'lucide-react'

type Tab = 'wie' | 'wat' | 'prijzen' | 'cases' | 'openers' | 'bezwaren' | 'niche' | 'afsluiter'

export default function ScriptPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('wie')

  const tabs: Array<{ key: Tab; label: string; icon: any }> = [
    { key: 'wie', label: 'Wie zijn we', icon: <User size={14} /> },
    { key: 'wat', label: 'Wat we doen', icon: <Briefcase size={14} /> },
    { key: 'prijzen', label: 'Prijzen', icon: <Euro size={14} /> },
    { key: 'cases', label: 'Cases', icon: <Trophy size={14} /> },
    { key: 'openers', label: 'Openers', icon: <MessageSquare size={14} /> },
    { key: 'bezwaren', label: 'Bezwaren', icon: <HelpCircle size={14} /> },
    { key: 'niche', label: 'Per niche', icon: <Target size={14} /> },
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
          {tab === 'niche' && <SectionNiche />}
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

      <h4 style={subHeaderStyle}>Waarom klanten voor ons kiezen (USP&apos;s)</h4>
      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: '#3F06E3' }}>1. Volledige code bouw = volledig ontzorgen</strong>
        <p style={{ marginTop: 6 }}>
          Wij bouwen sites in eigen code, geen Squarespace of Wix. Dat betekent: alles kan, geen beperkingen, geen zorgen over onderhoud. Klanten die zelf bouwen lopen vaak vast bij updates of beveiliging.
        </p>
      </div>

      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: '#3F06E3' }}>2. Kwartaal-hosting = elk kwartaal check-in</strong>
        <p style={{ marginTop: 6 }}>
          Hosting wordt per kwartaal gefactureerd. Bij elke factuur sturen wij ook een berichtje: &quot;Zijn er veranderingen? Missen we iets?&quot; Zo blijft je site altijd up-to-date zonder dat je het hoeft te onthouden.
        </p>
      </div>

      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: '#3F06E3' }}>3. Persoonlijk contact, één team</strong>
        <p style={{ marginTop: 6 }}>
          Geen bureau met accountmanager + designer + developer + copywriter. Sjoerd en Maartje zijn je vaste contact. Kort lijntje, snel schakelen.
        </p>
      </div>

      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: '#3F06E3' }}>4. Geen 12-maanden contracten</strong>
        <p style={{ marginTop: 6 }}>
          Kort proberen, verlengen als het werkt. Dat maakt drempel om te starten laag.
        </p>
      </div>

      <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: '#3F06E3' }}>5. Alles onder één dak</strong>
        <p style={{ marginTop: 6 }}>
          Design, code, tekst, foto, video, ads. Geen doorverwijzen. Als er iets bij komt kunnen we het intern oppakken.
        </p>
      </div>

      <h4 style={subHeaderStyle}>Ideale klant (waar we het meest voor betekenen)</h4>
      <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>MKB restaurants en horeca</strong> — Bierbrasserie Koster, Lumi&apos;s</li>
          <li><strong>MKB bouwbedrijven en industrie</strong> — Kunststofhuis Waterland, De LED Installateur</li>
          <li><strong>1 tot 100 medewerkers</strong> — te klein = geen budget; te groot = te veel intern proces</li>
          <li><strong>Denken vanuit persoonlijk contact + reële omzet</strong> — niet enkel &quot;we moeten iets&quot;, maar &quot;we willen groeien&quot;</li>
        </ul>
      </div>

      <h4 style={subHeaderStyle}>🚩 Rode vlaggen (niet forceren)</h4>
      <div style={{ padding: 14, background: '#FEF2F2', borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: '#991B1B' }}>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Budget-shoppers</strong> — zoeken enkel &quot;de goedkoopste&quot;. Onze prijs matcht niet met bodem-tarief.</li>
          <li><strong>Verkeerd verwachtingspatroon</strong> — verwachten leads of omzet-groei binnen 2 weken.</li>
          <li><strong>Te veeleisend / eeuwig revisies</strong> — willen 20+ mockups zonder betaald advies.</li>
          <li>Beter: netjes bespreken of een <strong>simpeler onepager</strong> (€750) past bij hun budget.</li>
        </ul>
      </div>
    </div>
  )
}

function SectionWat() {
  return (
    <div>
      <h3 style={headerStyle}>Wat we bieden</h3>
      <Service title="Websites" desc="Van simpele onepagers tot volledige project-sites. Volledige code bouw — geen Squarespace of Wix beperkingen." />
      <Service title="Social media" desc="Instagram, LinkedIn, TikTok. Consistent goede posts + video-content dat écht opvalt." />
      <Service title="Video &amp; foto" desc="Product-video, sfeer, bedrijfsverhaal, testimonials. Kwaliteit die past bij jullie merk." />
      <Service title="Online marketing" desc="Meta + Google ads, landing pages per doelgroep, conversie-optimalisatie." />
      <Service title="Content per branche" desc="Contentkalender + productie op maat voor jullie niche. Bijv. horeca of bouw." />

      <h4 style={subHeaderStyle}>Onderhoud &amp; updates na livegang</h4>
      <div style={{ padding: 14, background: '#F6F3FF', borderRadius: 10, fontSize: 13, lineHeight: 1.6 }}>
        <p style={{ marginBottom: 8 }}>Er zijn 2 opties voor updates na livegang:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>Standaard:</strong> updates op verzoek tegen <strong>€65 per uur</strong>. Voor kleine tweaks meestal 15–30 min = weinig kost.</li>
          <li><strong>Service in hosting:</strong> updates zitten inbegrepen in een iets hogere hosting-prijs. Handig als je regelmatig aanpassingen wil.</li>
        </ul>
        <p style={{ marginTop: 8, color: '#3F06E3', fontWeight: 600 }}>
          Voor beide opties: bij elke kwartaal-factuur sturen we een berichtje &quot;zijn er veranderingen nodig?&quot; — zo blijft niks liggen.
        </p>
      </div>
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
        <p><strong>Reactie:</strong> &quot;Snap ik. Wat had je in gedachten qua budget? We hebben ook simpele onepagers vanaf €750 — betere dan wat je zelf in elkaar zou zetten met Wix. Als we weten wat je budget is, kunnen we kijken wat we WEL kunnen doen — misschien een simpelere maar sterke site die past bij wat er nu nodig is.&quot;</p>
        <p style={{ marginTop: 6, fontSize: 12, color: '#5F5A72' }}>
          🚩 <em>Pas op:</em> als het budget rond &quot;zo laag mogelijk&quot; zit zonder concrete indicatie — dat is meestal budget-shopper. Vriendelijk afronden.
        </p>
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

function SectionNiche() {
  return (
    <div>
      <h3 style={headerStyle}>Tegen-antwoorden per branche</h3>
      <p style={{ fontSize: 13, color: '#5F5A72', marginBottom: 16 }}>
        Elke branche heeft z&apos;n eigen bezwaren. Per bezwaar 3 antwoord-varianten:
        <strong> zacht</strong> (voorzichtig openen), <strong>direct</strong> (helder confronteren),
        <strong> data</strong> (case-based). Kies wat past bij de toon van het gesprek.
      </p>

      {/* BOUWBEDRIJVEN */}
      <NicheBlock icon="🏗️" title="Bouwbedrijven &amp; aannemers" color="#F97316">
        <NRebut q='"We hebben het al te druk"' variants={[
          { tone: 'zacht', text: '"Snap ik, dat betekent dat het goed gaat. En dat is juist het moment — nu heb je de rust om iets neer te zetten wat over 6 maanden voor je werkt. In een dip staan er al 10 bureaus op te bellen."' },
          { tone: 'direct', text: '"Dan is dit juist hét moment. Nu komt werk via mond-tot-mond en dat werkt zolang het werkt. Een goede site geeft je bij drukte de keuze om selectief te zijn — niet meer werk, wel betere klanten."' },
          { tone: 'data', text: '"Perfect. Bij bouwbedrijven zien we vaak dat een strakke site vooral helpt met kwaliteit selectie: hogere opdracht-waarde, minder gedoe. Bij Kunststofhuis Waterland: 7 aanvragen per maand, waarvan ze de bulk kunnen wegwuiven en pakken wat past."' },
        ]} />

        <NRebut q='"We hebben geen website nodig, klanten kennen ons wel"' variants={[
          { tone: 'zacht', text: '"Klopt, jullie bestaande netwerk is sterk. Maar denk aan de volgende generatie opdrachtgevers — de projectmanagers die nu opkomen zoeken alles online. Zonder professionele site val je bij hen buiten de shortlist."' },
          { tone: 'direct', text: '"Bestaande klanten wel. Maar wat gebeurt er als er nieuwe grote opdrachtgever komt? Die Googlt eerst en beslist in 5 seconden of jullie serieus zijn. Nu spreekt jullie site niet de taal van jullie werkelijke kwaliteit."' },
          { tone: 'data', text: '"75% van B2B beslissers checkt online voor eerste contact. Dat betekent dat je 3 van de 4 mogelijke opdrachten misloopt zonder professionele online uitstraling — zonder dat je het weet."' },
        ]} />

        <NRebut q='"Onze site is al 5 jaar oud maar werkt prima"' variants={[
          { tone: 'zacht', text: '"Dat kan zeker. Alleen — een 5 jaar oude site oogt tegenwoordig niet meer op de hoogte van je vakmanschap. Bezoekers concluderen onbewust: dit bedrijf loopt achter. Dat verdien je niet."' },
          { tone: 'direct', text: '"Precies dat is het probleem. Een 5 jaar oude site zegt tegen bezoekers dit bedrijf loopt achter. Terwijl jullie waarschijnlijk juist voorop lopen in kwaliteit. Die mismatch kost je opdrachten."' },
          { tone: 'data', text: '"Bij Kunststofhuis Waterland hadden we exact dit: site 5 jaar oud, 0 aanvragen. Na renovatie: 7+ aanvragen per maand binnen 2 maanden. De kwaliteit die jullie leveren moet ook online te zien zijn — anders mis je opdrachten."' },
        ]} />

        <NRebut q='"Elke euro moet ik terugverdienen"' variants={[
          { tone: 'zacht', text: '"Terecht. Dat vinden wij ook. Bij bouw draait het vaak om 1 project van €10k+ dat de site tienvoudig terugverdient. Als jullie 1 keer per jaar een grote opdracht via online halen — is de investering voorbij."' },
          { tone: 'direct', text: '"Snap ik. Kijk naar het simpelste: 1 extra project per jaar via de site = €5-25k. De site zelf kost eenmalig €1.500-3.000. Reken maar terug. Enige risico is: niks doen."' },
          { tone: 'data', text: '"Onze klanten in de bouw verdienen de site gemiddeld terug binnen 3 maanden — bij grotere opdrachten sneller. Kunststofhuis Waterland: €0 aanvragen naar 7+/maand. Zelfs bij lage conversie tikt dat direct hard aan."' },
        ]} />

        <div style={{ padding: 12, background: '#FFF9EF', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#92400E' }}>
          <strong>Dingen om te benoemen bij bouwbedrijven:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Referentieprojecten zichtbaar met eigen foto&apos;s</li>
            <li>Kwaliteitscertificaten (VCA, ISO) op de site</li>
            <li>Expertise per specialisatie (nieuwbouw / renovatie / utiliteit)</li>
            <li>Kwaliteit online = signaal aan grote opdrachtgevers</li>
          </ul>
        </div>
      </NicheBlock>

      {/* HORECA */}
      <NicheBlock icon="🍽️" title="Restaurants &amp; horeca" color="#EF4444">
        <NRebut q='"We hebben geen tijd voor online, druk in de keuken"' variants={[
          { tone: 'zacht', text: '"Snap ik, dat is precies waarom wij het uit handen nemen. Jullie doen wat jullie het beste kunnen (koken + gasten), wij zorgen dat de site de aanvragen ophaalt zonder dat het jullie tijd kost."' },
          { tone: 'direct', text: '"Dan geeft de site je juist tijd terug. Reserveringen via site = geen telefoon meer op te nemen tijdens service. Een goede site scheelt je uren per week."' },
          { tone: 'data', text: '"Bij Bierbrasserie Koster: van 0 groepsreserveringen naar 1-3 grote groepen (20+ personen) per maand. Dat betekent minder telefoontjes tijdens service EN meer omzet. Beide winst."' },
        ]} />

        <NRebut q='"Onze klanten zijn vaste gasten"' variants={[
          { tone: 'zacht', text: '"Fantastisch, dat zegt veel over jullie kwaliteit. Maar nieuwe verhuizers of bedrijven zoeken een lunchplek via Google. Als jullie niet vindbaar zijn kennen zij jullie niet."' },
          { tone: 'direct', text: '"Vaste gasten zorgen voor omzet-stabiliteit. Nieuwe gasten zorgen voor groei. Als jullie site niet oogt zoals jullie eten smaakt, kies je effectief voor stagnatie."' },
          { tone: 'data', text: '"Voor 1-2 nieuwe reserveringen per week is de site sneller terugverdiend dan één dinerpakket voor 4. En het compound-effect: die nieuwe gasten worden vaste gasten."' },
        ]} />

        <NRebut q='"Google en Instagram is toch genoeg?"' variants={[
          { tone: 'zacht', text: '"Google en Instagram zijn een prima ingang — maar het is de site waar mensen daarna doorklikken om te beslissen. Als de site die vraag &apos;kom ik hier?&apos; niet snel beantwoordt, valt de reservering weg."' },
          { tone: 'direct', text: '"Google en Instagram brengen bezoekers naar je site. Als je site die bezoekers niet omzet in gasten, is het geld weggegooid. Wij bouwen sites die dat wél doen."' },
          { tone: 'data', text: '"Instagram-verkeer bounced gemiddeld 60% op een slechte site. Met een goede site is dat 25%. Voor jullie betekent dat elke Instagram-post ineens ~2x zoveel gasten oplevert."' },
        ]} />

        <div style={{ padding: 12, background: '#FFF9EF', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#92400E' }}>
          <strong>Dingen om te benoemen bij horeca:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Reserverings-integratie (groepen, arrangementen)</li>
            <li>Menu direct zichtbaar (mobiel!)</li>
            <li>Sfeerfoto&apos;s — wij kunnen ook zelf schieten</li>
            <li>Openingstijden en route (Google Maps)</li>
            <li>Instagram-feed embedded voor social proof</li>
          </ul>
        </div>
      </NicheBlock>

      {/* INSTALLATIE / TECHNIEK */}
      <NicheBlock icon="🔧" title="Installatiebedrijven &amp; techniek" color="#0EA5E9">
        <NRebut q='"Wij werken vooral op offerte, niet via de site"' variants={[
          { tone: 'zacht', text: '"Klopt voor grotere projecten. Maar de eerste kennismaking begint tegenwoordig online — mensen Googlen naar &apos;installateur in X&apos;. Als jullie daar bovenaan staan, komen die offerte-aanvragen bij jullie."' },
          { tone: 'direct', text: '"Offertes moeten ergens uit voortkomen. En steeds vaker begint dat met een Google search. Zonder goede site zit je gewoon niet aan tafel bij de eerste selectie."' },
          { tone: 'data', text: '"De LED Installateur haalt 3-5 kwalificatie-aanvragen per week via online — daaruit rollen ~2 offertes per week. Zelfde patroon zien we bij installateurs: online is nu de eerste stap naar offerte."' },
        ]} />

        <NRebut q='"Concurrenten hebben ook een site en die haalt niks"' variants={[
          { tone: 'zacht', text: '"Vaak omdat die site generic is — één van veel. Wij bouwen sites die richten op jullie unieke specialisatie + regio. Dat maakt het verschil tussen &apos;zomaar een installateur&apos; en &apos;dé specialist voor X in Y&apos;."' },
          { tone: 'direct', text: '"Precies daarom. Gemiddelde site levert niks op omdat &apos;ie generic is. Wij bouwen sites die opvallen: specifieke expertise, regio, sterke SEO. Zo pak je juist de leads die concurrenten laten liggen."' },
          { tone: 'data', text: '"Sites die niet vindbaar zijn krijgen 0 verkeer — dan is het geen wonder dat er niks komt. Wij checken je huidige positie in Google en laten zien hoe we die 10+ plaatsen kunnen opschuiven."' },
        ]} />

        <div style={{ padding: 12, background: '#EFF6FF', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#0369A1' }}>
          <strong>Dingen om te benoemen:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Servicegebied duidelijk (welke gemeenten)</li>
            <li>Specialisaties met eigen pagina</li>
            <li>Offerte-formulier met slimme velden</li>
            <li>Reviews en garantie zichtbaar</li>
            <li>Google &quot;services near me&quot; ranking</li>
          </ul>
        </div>
      </NicheBlock>

      {/* RETAIL / WINKELS */}
      <NicheBlock icon="🛍️" title="Retail &amp; winkels" color="#EC4899">
        <NRebut q='"Onze klanten komen fysiek langs"' variants={[
          { tone: 'zacht', text: '"Ja, maar ze checken eerst online: openingstijden, of jullie een specifiek product hebben. Een goede site zorgt dat ze niet naar de concurrent gaan voordat ze bij jullie langskomen."' },
          { tone: 'direct', text: '"Nog belangrijker: mensen willen weten waarom ze naar jullie moeten komen. Zonder duidelijke online etalage kiezen ze de zaak die zich wél laat zien."' },
          { tone: 'data', text: '"70% van winkelbezoekers checkt eerst online. Als jullie site oud oogt of onduidelijk is, gaan ze naar de winkel die zich duidelijker profileert. Sterke site = meer voetgangers, letterlijk."' },
        ]} />

        <NRebut q='"Webshops zijn te veel gedoe"' variants={[
          { tone: 'zacht', text: '"Hoeft ook helemaal geen webshop te zijn. Een online showroom met foto&apos;s en &apos;bel voor voorraad&apos;-knop kan al enorm helpen — zonder logistieke rompslomp."' },
          { tone: 'direct', text: '"Dat begrijp ik. Wij bouwen liever een sterke online showroom dan een half-werkende webshop. Later uitbreiden kan altijd — beginnen met minder gedoe en meer resultaat."' },
          { tone: 'data', text: '"90% van onze retail-klanten start zonder webshop. Sterk showroom + bel-voor-voorraad = veel meer voetgangers zonder de logistiek van pakketten. Werkt gewoon."' },
        ]} />

        <div style={{ padding: 12, background: '#FDF2F8', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#9F1239' }}>
          <strong>Dingen om te benoemen:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Product-highlights zonder volle shop</li>
            <li>Adres, openingstijden, route</li>
            <li>Instagram-integratie</li>
            <li>Google Business koppeling</li>
          </ul>
        </div>
      </NicheBlock>

      {/* SPORT / WELLNESS */}
      <NicheBlock icon="💪" title="Sport, fitness &amp; wellness" color="#22C55E">
        <NRebut q='"Ledenwerving via Instagram is genoeg"' variants={[
          { tone: 'zacht', text: '"Instagram brengt mensen naar jullie toe. Maar aanmelden gebeurt op de site. Als die niet meteen &apos;dit is voor mij, ik meld me nu&apos; triggert, haakt de lead af. Een goede site verhoogt de Instagram-conversie."' },
          { tone: 'direct', text: '"Instagram = herkenning. Site = aanmelding. Zonder goede site verlies je gewoon aanmeldingen die Instagram al binnen bracht. Dat is dubbel jammer."' },
          { tone: 'data', text: '"Bij fitness-clubs zien we standaard: Instagram brengt de mensen, maar de site converteert. Van 100 Insta-bezoekers meldt ~2% zich aan bij slechte site, ~8% bij goede site. 4x meer leden."' },
        ]} />

        <NRebut q='"Onze klanten kennen ons"' variants={[
          { tone: 'zacht', text: '"Prachtig, dat is de basis. Maar iedereen die naar de buurt verhuist en een nieuwe sportschool zoekt, Googlet. Als jullie niet bovenaan staan pakt de concurrent de nieuweling."' },
          { tone: 'direct', text: '"Bestaande leden zijn goed. Groei komt van nieuwe leden. Zonder goede vindbaarheid mis je precies die nieuwe leden."' },
          { tone: 'data', text: '"Sportscholen met sterke lokale SEO groeien gemiddeld 2-3x sneller in ledenaantal dan concurrenten zonder. Dat is direct omzet."' },
        ]} />

        <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#065F46' }}>
          <strong>Dingen om te benoemen:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Direct inschrijven / proefles boeken</li>
            <li>Rooster zichtbaar</li>
            <li>Foto&apos;s van sfeer en instructeurs</li>
            <li>Prijzen transparant</li>
          </ul>
        </div>
      </NicheBlock>

      {/* ZORG */}
      <NicheBlock icon="🏥" title="Zorg &amp; praktijken" color="#8B5CF6">
        <NRebut q='"Patiënten komen via verwijzing"' variants={[
          { tone: 'zacht', text: '"Deels via verwijzing, ja. Maar patiënten Googlen tegenwoordig ook zelf op &apos;fysio in X&apos; of &apos;tandarts in Y&apos;. Zonder sterke lokale site val je buiten die boot."' },
          { tone: 'direct', text: '"Verwijzers verwijzen. Maar mensen kiezen zelf. En dat begint online. Zonder goede site kies je onbewust voor stagnatie van patiënten-instroom."' },
          { tone: 'data', text: '"Bij zorgpraktijken zien we: 60-70% van nieuwe patiënten begint met een Google search — ook als ze een verwijzing hebben. Bij sterke site pak je gewoon meer van die groep."' },
        ]} />

        <NRebut q='"Website is duur voor een kleine praktijk"' variants={[
          { tone: 'zacht', text: '"Een simpele professionele site kan bij ons vanaf €750. Team-info, adres, contact, tijden. Meer heb je vaak niet nodig. Kost jullie dan 3-4 nieuwe patiënten en het is terugbetaald."' },
          { tone: 'direct', text: '"Kleine praktijk = kleine site = kleine investering. €750-1.500 eenmalig. Verdient zichzelf binnen enkele weken terug bij 1-2 nieuwe patiënten."' },
          { tone: 'data', text: '"Een gemiddelde nieuwe patiënt betekent voor jullie ~€500-1.500 aan behandelingen. Voor de kosten van 1-2 patiënten is de site af. Dat is een no-brainer."' },
        ]} />

        <div style={{ padding: 12, background: '#F5F0FF', borderRadius: 8, marginTop: 12, fontSize: 12, color: '#5B21B6' }}>
          <strong>Dingen om te benoemen:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6, lineHeight: 1.6 }}>
            <li>Vertrouwen via team-foto&apos;s en cv&apos;s</li>
            <li>Direct online afspraak boeken (integratie mogelijk)</li>
            <li>Vergoedingen en verzekering info</li>
            <li>Google &quot;X in stad&quot; ranking</li>
          </ul>
        </div>
      </NicheBlock>

      {/* UNIVERSELE GOUDEN LIJNEN */}
      <div style={{ marginTop: 20, padding: 16, background: '#F1ECFF', borderRadius: 12 }}>
        <strong style={{ color: '#3F06E3', fontSize: 14 }}>💎 Universele sterke lijnen (voor elke niche bruikbaar)</strong>
        <ul style={{ paddingLeft: 20, marginTop: 8, fontSize: 13, lineHeight: 1.7, color: '#1A1730' }}>
          <li>&quot;Jullie site is het visitekaartje — nu spreekt &apos;ie niet de taal van jullie kwaliteit.&quot;</li>
          <li>&quot;In 5 seconden beslissen bezoekers of ze blijven of weggaan. Wat zegt jullie site in 5 seconden?&quot;</li>
          <li>&quot;Wij lossen dit vaak op door een preview te maken — dan zie je meteen of onze aanpak past. Kost jullie niks.&quot;</li>
          <li>&quot;We zijn geen 12-maanden contract. Als het na 3 maanden niks oplevert, stop je gewoon.&quot;</li>
          <li>&quot;Modernica is klein en persoonlijk — je hebt direct contact, geen accountmanager.&quot;</li>
          <li>&quot;Doe alsof je even geen zorg hoeft te maken. Wij komen met een gratis preview, dan zie je zelf.&quot;</li>
        </ul>
      </div>
    </div>
  )
}

function NicheBlock({ icon, title, color, children }: any) {
  return (
    <div style={{ marginBottom: 24, padding: 16, background: 'white', borderRadius: 12, borderLeft: `4px solid ${color}`, border: '1px solid #E7E2F4' }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color }}>{icon} {title}</div>
      {children}
    </div>
  )
}

const toneColors: Record<string, { bg: string; text: string }> = {
  zacht:  { bg: '#F0FDF4', text: '#065F46' },
  direct: { bg: '#FEF3C7', text: '#92400E' },
  data:   { bg: '#EFF6FF', text: '#0369A1' },
}

function NRebut({ q, variants }: { q: string; variants: Array<{ tone: string; text: string }> }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1A1730' }}>{q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {variants.map((v, i) => {
          const c = toneColors[v.tone] || { bg: '#F6F3FF', text: '#5F5A72' }
          return (
            <div key={i} style={{ padding: 10, background: c.bg, borderRadius: 8, borderLeft: `3px solid ${c.text}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{v.tone}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: '#1A1730' }}>{v.text}</div>
            </div>
          )
        })}
      </div>
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
        <strong style={{ color: '#3F06E3', fontSize: 14 }}>⚡ Wat gebeurt er nu als de klant JA zegt — onze werkwijze</strong>
        <p style={{ marginTop: 8, fontSize: 12, color: '#5F5A72', fontStyle: 'italic' }}>
          Belangrijk: wij maken de preview VOOR het kennismakingsgesprek, zodat hun eerste reactie meteen zichtbaar is en het gesprek concreter wordt.
        </p>
        <ol style={{ marginTop: 10, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
          <li><strong>Preview / voorstel maken</strong> — Sjoerd of Maartje maakt binnen paar dagen een gratis preview (kost ons paar uur werk) met de look + prijs offerte</li>
          <li><strong>Kennismakingsgesprek</strong> (30 min video, of op locatie als ze willen) — samen de preview doornemen, reactie en wensen bespreken</li>
          <li><strong>Definitief voorstel &amp; contract</strong> — feedback verwerken, contract tekenen, <strong>50% aanbetaling</strong>. We starten pas nadat die binnen is.</li>
          <li><strong>Design fase</strong> — mockups + revisierondes (1–2 weken afhankelijk van scope)</li>
          <li><strong>Bouw fase</strong> — website wordt gebouwd (gemiddeld <strong>2 weken</strong>)</li>
          <li><strong>Test + livegang</strong> — samen doorlopen, feedback verwerken</li>
          <li><strong>Livegang + oplevering</strong> — laatste 50% betaling</li>
          <li><strong>3 maanden nazorg standaard (eerste kwartaal)</strong> — bugs, kleine tweaks, we kijken hoe alles loopt</li>
        </ol>
        <p style={{ marginTop: 10, fontSize: 12, color: '#5F5A72' }}>
          <strong>Doorlooptijd:</strong> simpele site ~2 weken vanaf contract tot live. Gemiddeld project 2–4 weken, afhankelijk van acceptatie en moeilijkheidsgraad.
        </p>
      </div>

      <div style={{ padding: 16, background: '#FFF9EF', borderRadius: 12, marginTop: 16 }}>
        <strong style={{ color: '#92400E', fontSize: 14 }}>💡 Wat de preview precies is (belangrijk om te weten)</strong>
        <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
          De preview is een <strong>echte look</strong> van hoe hun nieuwe site eruit zou zien — front-end / uiterlijk. Geen werkende back-end nog. Erbij: prijs-offerte + strategische aanpak.
        </p>
        <p style={{ marginTop: 8, fontSize: 13 }}>
          <strong>Conversie:</strong> als iemand écht geïnteresseerd is en de preview te zien krijgt, zegt <strong>~20% ja ik wil door</strong>.
        </p>
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
