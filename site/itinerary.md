---
layout: default
title: Draft Itinerary
permalink: /itinerary/
---

<section class="wall wall-hero full">
  <div class="wall-inner">
    <h1 class="shout">
      <span class="line">One Way</span>
      <span class="line line-small line-out">This</span>
      <span class="line">Could Go</span>
    </h1>

    <p class="wall-standfirst">Not a plan &mdash; a proposal, made concrete enough to argue with. This is what <a href="{{ '/questions/which-arc/' | relative_url }}">the split arc</a> would actually look like, day by day.</p>

    <p class="wall-credit credit">
      <span>Rome &middot; Barcelona &middot; Paris &middot; London</span>
      <span>15 days</span>
      <span>Four countries</span>
      <span>Nothing booked</span>
    </p>
  </div>
</section>

<div class="alert alert-info">
  <p class="alert-title">This is an argument, not an itinerary</p>
  <p>Nothing here is decided — see <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a>, <a href="{{ '/questions/pace/' | relative_url }}">Pace</a>, and <a href="{{ '/questions/how-many-countries/' | relative_url }}">Three countries or two?</a> for the open questions this itinerary answers one particular way. The point of writing it out is that a concrete plan is easier to react to than an abstract option. Disagree with a day, a city, or the whole shape of it — that reaction is the useful part.</p>
</div>

<h2 class="section-heading">Why this shape</h2>

<p>The <a href="{{ '/questions/which-arc/' | relative_url }}">split arc</a> is the one route that covers both the Mediterranean light of the first week and the northern cities the kids will actually remember — at the cost of the most travel days of any option on the table, and of overriding this site's own defaults on <a href="{{ '/questions/pace/' | relative_url }}">pace</a> (three bases, not four) and <a href="{{ '/questions/how-many-countries/' | relative_url }}">country count</a> (two, not four). Both pages say that trade is worth making on purpose, not by accident. This is what making it looks like.</p>

<p>Four bases, each getting its own suggested nights from that city's own page: <a href="{{ '/cities/rome/' | relative_url }}">Rome</a> (4), <a href="{{ '/cities/barcelona/' | relative_url }}">Barcelona</a> (3), <a href="{{ '/cities/paris/' | relative_url }}">Paris</a> (3), <a href="{{ '/cities/london/' | relative_url }}">London</a> (4) &mdash; fourteen nights, plus the day you fly home, which is fifteen days end to end. That runs a day or two past the "~2 weeks" target, and trimming a night somewhere to land closer to fourteen is a reasonable edit to make to this draft, not a flaw in the shape of it.</p>

<h2 class="section-heading">The calendar</h2>

{%- comment -%}
  The URLs are resolved before the table rather than inline: a `|` inside a
  Liquid filter reads as a cell separator to Markdown linters (MD056), even
  though Liquid resolves it away before kramdown ever parses the row.
{%- endcomment -%}
{%- assign rome_url = '/cities/rome/' | relative_url -%}
{%- assign barcelona_url = '/cities/barcelona/' | relative_url -%}
{%- assign paris_url = '/cities/paris/' | relative_url -%}
{%- assign london_url = '/cities/london/' | relative_url -%}

<div class="table-wrapper" markdown="1">

| Days | City | What | Getting there |
|---|---|---|---|
| 1 | Rome | Arrive (transatlantic), settle in | — |
| 2–4 | Rome | Ancient Rome, Vatican, centro storico, Appian Way / open day — see [Rome's day sketch]({{ rome_url }}) | — |
| 5 | Rome → Barcelona | Fly Rome → Barcelona, arrive evening | ~2h flight |
| 6–7 | Barcelona | Sagrada Família, Gothic Quarter, Montjuïc — see [Barcelona's day sketch]({{ barcelona_url }}) | — |
| 8 | Paris | Barcelona → Paris, arrive evening | ~2h flight, or 6h45 direct train |
| 9–10 | Paris | Louvre, Orsay, Sainte-Chapelle, Le Marais — see [Paris's day sketch]({{ paris_url }}) | — |
| 11 | London | Paris → London, arrive same afternoon | 2h20 Eurostar |
| 12–14 | London | Westminster, British Museum, Tower, museums — see [London's day sketch]({{ london_url }}) | — |
| 15 | — | Fly home | Transatlantic |

</div>

<p>The two intra-European legs worth a second look: <strong>Rome→Barcelona</strong> is a flight because rail between Italy and Spain means routing up through France with several changes (see <a href="{{ '/questions/trains-vs-flights/' | relative_url }}">Trains or budget flights?</a>). <strong>Barcelona→Paris</strong> is the one genuine judgment call on the whole route — 6h45 by direct train, or about 2 hours in the air. This draft assumes the flight to protect a full day in Barcelona; taking the train instead is a real option and would mean losing half a day somewhere to make room for it.</p>

<h2 class="section-heading">What this costs, plainly</h2>

<p>Three intercity moves and two transatlantic flights against fifteen days is more transit than a three-base trip would ask for, and every city here gets fewer nights than <a href="{{ '/questions/pace/' | relative_url }}">Pace</a>'s three-base default of four-plus. Barcelona and Paris in particular get three nights each, which is enough for the headline sights and the neighborhood on each city's day sketch, not much slack beyond it.</p>

<p>What it buys back: Mediterranean daylight and mild weather for the first week, in Rome and Barcelona, and the northern cities — the ones a 17- and 18-year-old are more likely to remember — for the second. No other route on this site gets both. Whether that trade is worth the pace is exactly the question <a href="{{ '/questions/pace/' | relative_url }}">Pace</a> and <a href="{{ '/questions/what-kids-want/' | relative_url }}">What do Bubu and Gaby want?</a> are for.</p>

{% include close-wall.html
   shout_a="Argue"
   shout_b="With It"
   standfirst="This is one person&rsquo;s answer to which arc, written out far enough to disagree with specifically. Say which day you&rsquo;d cut, which city you&rsquo;d trade, or whether the whole shape is wrong."
   action="Say what you think"
   href="/feedback/" %}
