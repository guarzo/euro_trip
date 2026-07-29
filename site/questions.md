---
layout: default
title: Questions
permalink: /questions/
---

{% assign open_questions = site.questions | where: "status", "open" | sort: "order" %}
{% assign decided_questions = site.questions | where: "status", "decided" | sort: "order" %}

<section class="wall wall-hero full">
  <div class="wall-inner">
    <h1 class="shout">
      <span class="line">Argue</span>
      <span class="line line-small line-out">With</span>
      <span class="line">Me</span>
    </h1>

    <p class="wall-standfirst">{{ site.questions | size }} decisions stand between this and a real trip. Each one has options, a recommendation, and a section on what would change its mind.</p>

    <p class="wall-credit credit">
      <span>{{ open_questions | size }} open</span>
      <span>Nothing settled</span>
      <span>Every page takes comments</span>
    </p>

    <a class="action" href="{{ '/questions/which-arc/' | relative_url }}">Start with the big one &rarr;</a>
  </div>
</section>

<div class="alert alert-info">
  <p class="alert-title">How to use this</p>
  <p>Each question has options, a recommendation, and a comment thread. Disagree freely — a recommendation is a starting point, not a verdict. Start with <a href="{{ '/questions/which-arc/' | relative_url }}">Which arc?</a>, since most of the others depend on it.</p>
</div>

<h2 class="section-heading">Still open &mdash; {{ open_questions | size }}</h2>

<div class="postered full">
  <div class="bill-stack">
  {%- for q in open_questions -%}
    <div class="bill">
      <a class="bill-link" href="{{ q.url | relative_url }}">
        <span class="bill-name">{{ q.question }}</span>
      </a>
      <span class="bill-credit credit">
        <span class="bill-impact" data-impact="{{ q.impact }}">{{ q.impact }} impact</span>
        <span>Still open</span>
      </span>
    </div>
  {%- endfor -%}
  </div>
</div>

{% if decided_questions.size > 0 %}
<h2 class="section-heading">Decided &mdash; {{ decided_questions | size }}</h2>

<div class="postered full">
  <div class="bill-stack">
  {%- for q in decided_questions -%}
    <div class="bill">
      <a class="bill-link" href="{{ q.url | relative_url }}">
        <span class="bill-name">{{ q.question }}</span>
      </a>
      <span class="bill-credit credit">
        <span class="bill-impact" data-impact="{{ q.impact }}">{{ q.impact }} impact</span>
        <span>Decided</span>
      </span>
    </div>
  {%- endfor -%}
  </div>
</div>
{% endif %}

{% include close-wall.html
   shout_a="Nothing"
   shout_b="Settled"
   standfirst="Every recommendation here is one person&rsquo;s reasoning, written down so it can be argued with. The most useful thing you can do is disagree with one."
   action="Say what you think"
   href="/feedback/" %}
