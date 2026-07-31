---
layout: default
title: Cities
permalink: /cities/
---

{%- assign country_count = site.cities | map: "country" | uniq | size -%}
<section class="wall wall-hero full">
  <div class="wall-inner">
    <h1 class="shout">
      <span class="line">{% include number-word.html num=site.cities.size %}</span>
      <span class="line line-small line-out">Cities</span>
      <span class="line">{% include number-word.html num=country_count %} Countries</span>
    </h1>

    <p class="wall-standfirst">All workable in winter, some far more comfortably than others. No trip visits all of them &mdash; two weeks covers three or four bases.</p>

    <p class="wall-credit credit">
      <span>Tap a city to read it</span>
      <span>Mark what you want</span>
      <span>Everyone sees your picks</span>
    </p>
  </div>
</section>

<div class="alert alert-info">
  <p class="alert-title">These are candidates, not a route</p>
  <p>No trip visits all of them. Two weeks realistically covers three or four bases. Read what appeals, and see <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a> for how they group into actual trips. Places that <em>don't</em> work in winter are on <a href="{{ '/ruled-out/' | relative_url }}">Ruled Out</a>, with reasons.</p>
  <p>Each city's suggested nights are for <em>that city alone</em> — they don't sum to a trip length. A route uses three or four of these cities, not all of them.</p>
</div>

<p class="interest-note">Everyone&rsquo;s marks show below. Tap yours to change it &mdash; the same mark shows on the city&rsquo;s own page.</p>

{% assign countries = site.cities | group_by: "country" | sort: "name" %}
{% for group in countries %}
<h2 class="section-heading">{{ group.name }}</h2>

<div class="postered full">
  <div class="bill-stack">
  {%- assign sorted_cities = group.items | sort: "city" -%}
  {%- for city in sorted_cities -%}
    <div class="bill">
      <a class="bill-link" href="{{ city.url | relative_url }}">
        <span class="bill-name">{{ city.city }}</span>
        <span class="bill-sub">{{ city.suggested_nights }} nights suggested</span>
      </a>
      <span class="bill-credit credit">
        <span class="bill-viability" data-viability="{{ city.winter_viability }}">
          {%- comment -%}
            Only 'good' and 'mixed' exist in the data today. The fallback
            carries 'poor' and says so in the same words as the city page,
            so the two never drift apart.
          {%- endcomment -%}
          {%- if city.winter_viability == 'good' -%}Good in winter
          {%- elsif city.winter_viability == 'mixed' -%}Mixed in winter
          {%- else -%}Largely closed in winter{%- endif -%}
        </span>
      </span>
      <div class="interest-row" data-interest-key="city:{{ city.city | downcase | replace: ' ', '-' }}"></div>
    </div>
  {%- endfor -%}
  </div>
</div>
{% endfor %}

{% include close-wall.html
   shout_a="Which"
   shout_b="Ones"
   standfirst="Your marks are visible to everyone. Saying so out loud is what actually moves the trip &mdash; and the arc question is where that argument really happens."
   action="Pick an arc"
   href="/questions/which-arc/" %}
