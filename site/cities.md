---
layout: default
title: Cities
permalink: /cities/
---

<section class="hero">
  <h1 class="hero-title">Candidate Cities</h1>
  <p class="hero-subtitle">Eleven cities, six countries — all of them viable in winter</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">These are candidates, not a route</p>
  <p>No trip visits all eleven. Two weeks realistically covers three or four bases. Read what appeals, and see <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a> for how they group into actual trips. Places that <em>don't</em> work in winter are on <a href="{{ '/ruled-out/' | relative_url }}">Ruled Out</a>, with reasons.</p>
</div>

<p class="interest-note">Tap ☆ to mark a city. Picks are saved in your own browser and are not shared with anyone.</p>

{% assign countries = site.cities | group_by: "country" | sort: "name" %}
{% for group in countries %}
<h2 class="section-heading">{{ group.name }}</h2>

<div class="itinerary-list">
{% assign sorted_cities = group.items | sort: "city" %}
{% for city in sorted_cities %}
  <div class="itinerary-item">
    <a href="{{ city.url | relative_url }}">
      <span class="itinerary-location">{{ city.city }}</span>
      <span class="itinerary-day-date">
        {% if city.winter_viability == 'good' %}☀️ Good in winter
        {% elsif city.winter_viability == 'mixed' %}🌧️ Mixed in winter
        {% else %}❄️ Largely closed{% endif %}
        &bull; suggest {{ city.suggested_nights }} nights
      </span>
    </a>
    <button class="interest-toggle"
            data-interest-key="city:{{ city.city | downcase | replace: ' ', '-' }}"
            aria-pressed="false">☆ Interested?</button>
  </div>
{% endfor %}
</div>
{% endfor %}
