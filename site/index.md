---
layout: default
title: Home
---

{%- comment -%}
  FIRST VIEWPORT. The thesis, not a header. Three words at architectural
  scale tell a teenager on a phone the one thing that makes their opinion
  matter: nothing has been decided yet.
{%- endcomment -%}
<section class="wall wall-hero full">
  <div class="wall-inner">
    <h1 class="shout">
      <span class="line">Nothing</span>
      <span class="line line-small line-out">Is</span>
      <span class="line">Decided</span>
    </h1>

    <p class="wall-standfirst">Not the dates. Not the countries. Not how long. This site exists to change that &mdash; and you are one of the people who gets to decide.</p>

    <p class="wall-credit credit">
      <span>Six countries</span>
      <span>Eleven cities</span>
      <span>Fourteen days</span>
      <span>Winter 2028/29</span>
      <span>No plan</span>
    </p>

    <a class="action" href="{{ '/questions/which-arc/' | relative_url }}">Argue with me &rarr;</a>
  </div>
</section>

<h2 class="section-heading">The one fact that decides this trip</h2>

<p>Every argument on this site eventually comes back to daylight. In late December the sun sets before 4&nbsp;PM in London and after 6&nbsp;PM in Seville. Over fourteen days that gap is a materially different holiday &mdash; and it is the thing people underestimate most.</p>

{%- comment -%}
  Sunset times are the same figures published on the Logistics page. Bars are
  scaled against a 3:00 PM floor rather than against London, so the darkest
  city still reads as "least light" instead of as a broken row.
{%- endcomment -%}
<ol class="daylight">
  <li class="daylight-row" data-extreme="light">
    <span class="daylight-city">Seville</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:100%"></span></span>
    <span class="daylight-time">6:00 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Granada</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:100%"></span></span>
    <span class="daylight-time">6:00 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Madrid</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:97%"></span></span>
    <span class="daylight-time">5:55 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Barcelona</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:83%"></span></span>
    <span class="daylight-time">5:30 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Athens</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:77%"></span></span>
    <span class="daylight-time">5:20 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Paris</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:63%"></span></span>
    <span class="daylight-time">4:55 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Naples</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:58%"></span></span>
    <span class="daylight-time">4:45 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Florence</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:58%"></span></span>
    <span class="daylight-time">4:45 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Rome</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:56%"></span></span>
    <span class="daylight-time">4:40 PM</span>
  </li>
  <li class="daylight-row">
    <span class="daylight-city">Amsterdam</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:50%"></span></span>
    <span class="daylight-time">4:29 PM</span>
  </li>
  <li class="daylight-row" data-extreme="dark">
    <span class="daylight-city">London</span>
    <span class="daylight-bar" aria-hidden="true"><span style="width:29%"></span></span>
    <span class="daylight-time">3:53 PM</span>
  </li>
</ol>

<p class="daylight-note">Sunset, late December &mdash; more than two hours of usable afternoon between top and bottom.</p>

<div class="alert alert-info">
  <p class="alert-title">Where we are</p>
  <p>This is a planning site, not an itinerary. No dates, no route, and no bookings exist yet. It has two jobs: show what these cities are actually like <em>in winter</em>, and lay out the decisions we need to make. Browse the cities, then weigh in on the questions.</p>
</div>

<h2 class="section-heading">The big one: which arc?</h2>

<p>The southern countries and the northern cities are two coherent trips, not one. Cramming all six countries into two weeks means about a third of the trip in transit. Pick a lane:</p>

<div class="table-wrapper" markdown="1">

| Arc | Cities | The case for it | The catch |
|---|---|---|---|
| **Mediterranean** | Athens · Rome · Barcelona/Madrid | Mild and bright, slower pace, the original idea | Three flights between bases |
| **Northern classics** | London · Paris · Amsterdam | Tightest logistics of any option — all trains, city center to city center | Dark and wet; Amsterdam's sun sets at 4:29 PM in late December |
| **Split arc** | Rome · Barcelona · Paris · London | Covers both moods | The most days in transit; drops Greece |

</div>

<p><a href="{{ '/questions/which-arc/' | relative_url }}">Read the full breakdown and weigh in &rarr;</a></p>

<h2 class="section-heading">Open Questions</h2>

<p>Ten decisions are on the table, from exact dates to whether we take trains or budget flights. Each has its own page with options, a recommendation, and a section on what would change its mind.</p>

{%- comment -%}
  The four highest-impact open questions, pasted up as bills. The rest live
  on the questions index; this is the door, not the list.
{%- endcomment -%}
<div class="postered full">
  <div class="bill-stack">
  {%- assign top_questions = site.questions | where: "impact", "high" | sort: "order" -%}
  {%- for q in top_questions -%}
    <div class="bill">
      <a class="bill-link" href="{{ q.url | relative_url }}">
        <span class="bill-name">{{ q.question }}</span>
      </a>
      <span class="bill-credit credit">
        <span class="bill-impact" data-impact="{{ q.impact }}">{{ q.impact }} impact</span>
        <span>{% if q.status == 'decided' %}Decided{% else %}Still open{% endif %}</span>
      </span>
    </div>
  {%- endfor -%}
  </div>
</div>

<p><a href="{{ '/questions/' | relative_url }}">See all ten questions &rarr;</a></p>

<h2 class="section-heading">Eleven cities on the table</h2>

<p>Nobody visits all of them. Two weeks realistically covers three or four bases. Read what appeals, mark what you want, and say so.</p>

<p><a href="{{ '/cities/' | relative_url }}">Browse the cities &rarr;</a></p>

{%- comment -%}
  A page never ends on a reading column; it ends anchored on a wall.
{%- endcomment -%}
{% include close-wall.html
   shout_a="Say"
   shout_b="Something"
   standfirst="&ldquo;I don&rsquo;t want to go to another museum&rdquo; is useful. So is &ldquo;I only care about Rome.&rdquo; Nothing is booked, so changing the plan costs nothing today."
   action="Weigh in"
   href="/feedback/" %}
