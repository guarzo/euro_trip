---
layout: default
title: Questions
permalink: /questions/
---

<section class="hero">
  <h1 class="hero-title">Open Questions</h1>
  <p class="hero-subtitle">The decisions that need answers before anything gets booked</p>
</section>

<div class="alert alert-info">
  <p class="alert-title">How to use this</p>
  <p>Each question has options, a recommendation, and a comment thread. Disagree freely — a recommendation is a starting point, not a verdict. Start with <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a>, since most of the others depend on it.</p>
</div>

{% assign open_questions = site.questions | where: "status", "open" | sort: "order" %}
{% assign decided_questions = site.questions | where: "status", "decided" | sort: "order" %}

<h2 class="section-heading">🟡 Still open ({{ open_questions | size }})</h2>

<div class="itinerary-list">
{% for q in open_questions %}
  <a href="{{ q.url | relative_url }}" class="itinerary-item">
    <span class="itinerary-location">{{ q.question }}</span>
    <span class="itinerary-day-date">{{ q.impact }} impact</span>
  </a>
{% endfor %}
</div>

{% if decided_questions.size > 0 %}
<h2 class="section-heading">✅ Decided ({{ decided_questions | size }})</h2>

<div class="itinerary-list">
{% for q in decided_questions %}
  <a href="{{ q.url | relative_url }}" class="itinerary-item">
    <span class="itinerary-location">{{ q.question }}</span>
    <span class="itinerary-day-date">{{ q.impact }} impact</span>
  </a>
{% endfor %}
</div>
{% endif %}
