# Template Engine

{% hint style="info" %}

## Quick Summary

The Template Engine, powered by Twig, is used to manipulate and dynamically generate large blocks of text or code with your own data, such as records from your Xano database, or from inputs sent to your APIs.

It's great for helping generate things like AI prompts, HTML, and other more large-format data without messing around with a bulk of separate functions to do so.
{% endhint %}

{% embed url="<https://youtu.be/YCGM7bF3Qc4>" %}

## What is the Template Engine?

At its core, think of the Template Engine as text replacement and manipulation of the future. It is designed to give you a simple syntax to quickly manipulate large text strings with dynamic data, such as...

* AI Prompts
* HTML
* JSON
* SQL queries

The template engine is powered by Twig, which you can learn more about [here](https://twig.symfony.com/).

## When should I use the Template Engine instead of other text filters?

You should stick with filters like [replace](https://docs.xano.com/the-function-stack/filters/text#replace) or [sprintf](https://docs.xano.com/the-function-stack/filters/text#sprintf) if you're manipulating short strings of text, such as:

* Replacing a name inside of a string like "Hello, \[first\_name] \[last\_name]"
* Dynamically providing a price for a single product

The Template Engine, however, is useful for content templates where:

* The template will be edited by non-developers
* The data structure is complex with nested objects
* You need to include conditional sections
* Data formatting (like dates) needs to be consistent
* Templates might be reused with different data sources

If you're doing dynamic replacement over a longer block of text, such as the example below, Template Engine will make this much easier for you.

```twig
Write a personalized email to {{ $customer.firstName }} {{ $customer.lastName }} about their recent {{ $order.type }} purchase.

Include:
- Reference to their purchase history (they've ordered {{ $customer.purchaseCount }} times)
- Mention that their {{ $order.item }} will be delivered on {{ $order.deliveryDate|date('F j, Y') }}
- If {{ $customer.isVIP }}, offer them a {{ $promotions.VIPDiscount }}% discount on their next purchase
- Thank them for being a customer since {{ $customer.joinDate|date('Y') }}

Sign off with the name of their account manager: {{ $accountManager.name }}
```

## Using the Template Engine

{% stepper %}
{% step %}

### Look for the Template Engine function under Utility Functions.

<div align="left"><figure><img src="https://3699875497-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F2tWsL4o1vHmDGb2UAUDD%2Fuploads%2FTf5FE3kGjwJFG8WWNy0n%2FCleanShot%202025-04-02%20at%2016.29.13.png?alt=media&#x26;token=8bbc4381-82cf-408a-af17-9b3bf0f6c70b" alt=""><figcaption></figcaption></figure></div>
{% endstep %}

{% step %}

### Once you add the Template Engine to your function stack, click the :pencil2: button in the panel to open the editor, or use the AI assistant to help write a template for you

{% endstep %}

{% step %}

### Take a tour of the editor and begin building your template.

<figure><img src="https://3699875497-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F2tWsL4o1vHmDGb2UAUDD%2Fuploads%2FO9dhVXAaiLRKmNX5wrJX%2FCleanShot%202025-04-02%20at%2016.33.01.png?alt=media&#x26;token=928b4ec3-aee1-4dd1-8b89-3497e5dbd37e" alt=""><figcaption></figcaption></figure>
{% endstep %}
{% endstepper %}

## Template Syntax

### Variables

Variables are wrapped in {{ curly braces }}, like this, and begin with a $ character. In the below example, we're getting the `name` from an object stored in the `user1` variable.

```twig
Hi, {{ $user1.name }}
```

Reference items in an array by using the item index.

```twig
Hi, {{ $users.0.name }}
```

### Conditionals

Conditionals are helpful if you want to dynamically determine what the end result of your template looks like outside of the actual data. For example, maybe you want VIP users to have a different greeting than regular users.

Conditionals are wrapped in {% and %} and have support for `else` and `else if`

```twig
{% if $user1.vip == true %}
  Hey, {{ $user1.name }}! Thanks for being a part of our VIP program.
{% else %}
  Hey, {{ $user1.name }}! Thanks for reading.
{% endif %}
```

> In the above example, for this user:
>
> ```
> {
>     "name" == "Chris",
>     "vip" == true
>     }
> ```
>
> ...the result would be:
>
> ```
> Hey, Chris! Thanks for being a part of our VIP program.
> ```

```twig
{% if $score >== 90 %}
  Your grade is an A
{% elseif $score >== 80 %}
  Your grade is a B
{% elseif $score >== 70 %}
  Your grade is a C
{% else %}
  Your grade is an F
{% endif %}
```

> In the above example, for this score:
>
> ```
> score = 85
> ```
>
> ...the result would be:
>
> ```
> Your grade is a B
> ```

### Loops

You can use loops to populate lists of data without having to write out separate lines for each item, or knowing how many items you'll need to populate.

```twig
{% for item in $order.items %}
  - {{ item.quantity }}x {{ item.name }} at ${{ item.price }} each
{% endfor %}
```

<table data-full-width="true"><thead><tr><th>Data</th><th>Sample Output</th></tr></thead><tbody><tr><td><pre class="language-json"><code class="lang-json">[
  {
    quantity: 2,
    name: "Blue T-shirt",
    price: 19.99
    },
  {
    quantity: 1,
    name: "Denim jeans",
    price: 59.99
    },
  {
    quantity: 3,
    name: "Cotton Socks",
    price: 4.99
    }
]
</code></pre></td><td><p></p><ul><li>2x Blue T-shirt at $19.99 each</li><li>1x Denim Jeans at $59.99 each</li><li>3x Cotton Socks at $4.99 each</li></ul></td></tr></tbody></table>

You can also use an Else statement at the end of your For loop to determine what action to take if no items are found. In the next example, if `$list` contains no items, the template will return `No items found.`

```twig
{% for item in $list %}
  {{ item }}
{% else %}
  No items found.
{% endfor %}
```

### Filters

You can use Twig's built in filters, similar to our own, to transform or manipulate data as part of the template.

The below list is some of the most essential filters used in Twig, but it is not all of them. You can review the entire list [here](https://twig.symfony.com/doc/3.x/filters/index.html).

<table><thead><tr><th width="148.541259765625">Filter</th><th width="161.507080078125">Description</th><th width="271.359375">Example</th><th>Result</th></tr></thead><tbody><tr><td><code>upper</code></td><td>Converts string to uppercase</td><td><code>{{ $user.name|upper }}</code><br><em>When $user.name is "John Smith"</em></td><td>"JOHN SMITH"</td></tr><tr><td><code>lower</code></td><td>Converts string to lowercase</td><td><code>{{ $user.name|lower }}</code><br><em>When $user.name is "John Smith"</em></td><td>"john smith"</td></tr><tr><td><code>trim</code></td><td>Removes whitespace from the beginning and end of a string</td><td><code>{{ $user.input|trim }}</code><br><em>When $user.input is " hello "</em></td><td>"hello"</td></tr><tr><td><code>join</code></td><td>Joins array elements into a string with a delimiter</td><td><code>{{ $user.tags|join(', ') }}</code><br><em>When $user.tags is ["php", "twig", "web"]</em></td><td>"php, twig, web"</td></tr><tr><td><code>default</code></td><td>Provides a fallback value if the variable is null, empty, or undefined</td><td><code>{{ $user.middleName|default('No middle name') }}</code><br><em>When $user.middleName is null</em></td><td>"No middle name"</td></tr><tr><td><code>number_format</code></td><td>Formats numbers with grouped thousands and decimal points</td><td><code>{{ $product.price|number_format(2, '.', ',') }}</code><br><em>When $product.price is 1234.56</em></td><td>"1,234.56"</td></tr><tr><td><code>shuffle</code></td><td>Randomly shuffles an array</td><td><code>{{ $user.items|shuffle }}</code><br><em>When $user.items is ["a", "b", "c"]</em></td><td><em>Random order like:</em> ["c", "a", "b"]</td></tr><tr><td><code>date</code></td><td>Formats dates using PHP's date syntax</td><td><code>{{ $user.createdAt|date("F j, Y") }}</code><br><em>When $user.createdAt is "2023-12-25"</em></td><td>"December 25, 2023"</td></tr></tbody></table>

### Escape Filter (e)

The escape filter is used to format text using specifications designated by the destination, such as a URL that only allows certain characters to remain valid.

When you use `e` by itself without specifying a format, it typically defaults to HTML escaping. This means it will convert characters like `<`, `>`, `&`, `"`, and `'` to their HTML-safe equivalents.

When you specify a format (like `e('html')`, `e('js')`, `e('url')`, etc.), you're explicitly telling the Template Engine how to escape the content for a specific context, which can provide more precise protection. We'd recommend always specifying the format, just to be safe.

#### HTML Escaping

```twig
{% set $user_input = '<script>alert("XSS");</script>' %}
{{ $user_input|e('html') }}

Outputs: &lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;
```

#### JavaScript Escaping

```twig
{% set $js_string = 'Hello "world"! \n New line' %}
{{ $js_string|e('js') }}
{# Outputs: Hello \"world\"! \\n New line #}
```

#### URL Escaping

```twig
{% set $search_query = 'hello world & special chars' %}
{{ $search_query|e('url') }}
{# Outputs: hello+world+%26+special+chars #}
```

#### CSS Escaping

```twig
{% set $css_value = 'expression(alert("XSS"))' %}
{{ $css_value|e('css') }}
{# Outputs: expression\28 alert\28 "XSS"\29 \29 #}
```

### Comments

You can insert comments into your templates by wrapping them in {# and #}. They won't appear in your final template.

```twig
{# This is a hidden comment #}
```

You can check out some examples of the Template Engine in real-world scenarios here: [#sample-templates](#sample-templates "mention").

## Sample Templates

Use these sample templates to get started with templates quickly and understand what real-world use cases might look like.

### AI Prompting Template

**Context**: A template for generating structured AI prompts with dynamic instructions, constraints, and example inputs/outputs.

```twig
You are an AI assistant tasked with {{ $task.description }}.

Context:
{% if $context %}
{{ $context }}
{% else %}
*No additional context provided*
{% endif %}

Instructions:
1. {{ $task.primaryInstruction }}
{% for $step in $task.additionalSteps %}
{{ loop.index + 1 }}. {{ $step }}
{% endfor %}

Constraints:
{% for $constraint in $task.constraints %}
- {{ $constraint }}
{% endfor %}

Output Format:
{{ $output.format }}

Example Input:
{{ $example.input }}

Example Expected Output:
{{ $example.output }}
```

### HTML Template

**Context**: A product listing page for an e-commerce website, showing personalized content based on user authentication and product availability.

```twig
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{{ $page.title }}</title>
    </head>
    <body>
        <header>
            <h1>Welcome, {{ $user.name }}!</h1>
        </header>
        
        <nav>
            {% if $user.isLoggedIn %}
                <a href="/profile">My Profile</a>
                <a href="/logout">Logout</a>
            {% else %}
                <a href="/login">Login</a>
                <a href="/register">Register</a>
            {% endif %}
        </nav>
        
        <main>
            {% for $item in $products %}
                <div class="product">
                    <h2>{{ $item.name }}</h2>
                    <p>Price: ${{ $item.price|number_format(2) }}</p>
                    {% if $item.inStock %}
                        <button>Add to Cart</button>
                    {% else %}
                        <span class="out-of-stock">Out of Stock</span>
                    {% endif %}
                </div>
            {% endfor %}
        </main>
    </body>
</html>
```

{% hint style="success" %}

## Hint

Use an HTML template in combination with our [#http-header](https://docs.xano.com/the-function-stack/functions/utility-functions#http-header "mention") function to serve HTML directly using your APIs by setting the header `Content-Type: text/html; charset=utf-8`
{% endhint %}

### SQL Query Template

**Context**: A flexible database query generator that adapts to user roles and filtering requirements for a multi-tenant application.

{% hint style="danger" %}

## PREVENTING SQL INJECTION ATTACKS

Xano offers some filters to help ensure that any dynamic / user input is not parsed in a way that might harm your database or cause other unintended consequences.

Make sure to process your inputs **before** they are used in any SQL queries with the appropriate filter.

These filters are [sql\_alias and sql\_esc](https://docs.xano.com/the-function-stack/filters/text#sql_alias)
{% endhint %}

```twig
SELECT 
    id, 
    {{ $select_columns|join(', ') }} 
FROM {{ $table_name }}
WHERE 
    {% if $user.role == 'admin' %}
        1=1
    {% else %}
        organization_id = {{ $user.organization_id }}
    {% endif %}
    {% if $filters.status %}
        AND status = '{{ $filters.status }}'
    {% endif %}
ORDER BY 
    {% if $sort_by %}
        {{ $sort_by }} {{ $sort_direction|default('ASC') }}
    {% else %}
        created_at DESC
    {% endif %}
LIMIT {{ $limit|default(10) }}
```

{% hint style="success" %}

## Hint

Use an SQL template in combination with our [direct-database-query](https://docs.xano.com/the-function-stack/functions/database-requests/direct-database-query "mention") function to dynamically generate and use SQL queries against your Xano database. You can also use our [external-database-query](https://docs.xano.com/the-function-stack/functions/database-requests/external-database-query "mention") functions the same way.

Just type `?:raw` into the query editor and point the statement argument to the output of your Template Engine function.
{% endhint %}

### Markdown Template

**Context**: A Twig template for generating raw Markdown code with dynamic content and metadata.

```twig
{% if $document.title %}# {{ $document.title }}{% endif %}
{% if $author.name %}Author: {{ $author.name }}{% endif %}
{% if $document.date %}Date: {{ $document.date|date('Y-m-d') }}{% endif %}

## Overview

{% if $document.summary %}
{{ $document.summary }}
{% else %}
*No summary available*
{% endif %}

### Key Points

{% for $point in $document.keyPoints %}
- {{ $point }}
{% endfor %}

## Content

{{ $document.content }}

{% if $document.tags %}
### Tags

{% for $tag in $document.tags %}
`{{ $tag }}`{% if not loop.last %}, {% endif %}
{% endfor %}
{% endif %}

{% if $document.footnotes %}
## Footnotes

{% for $footnote in $document.footnotes %}
[^{{ loop.index }}]: {{ $footnote }}
{% endfor %}
{% endif %}

```

### Email Template

**Context**: A flexible email template system that supports personalized messaging, dynamic sections, and optional signatures.

```twig
{% if $document.title %}# {{ $document.title }}{% endif %}

{% if $author.name %}Author: {{ $author.name }}{% endif %}
{% if $document.date %}Date: {{ $document.date|date('Y-m-d') }}{% endif %}

## Overview

{% if $document.summary %}
{{ $document.summary }}
{% else %}
*No summary available*
{% endif %}

### Key Points

{% for $point in $document.keyPoints %}
- {{ $point }}
{% endfor %}

## Content

{{ $document.content }}

{% if $document.tags %}
### Tags

{% for $tag in $document.tags %}
`{{ $tag }}`{% if not loop.last %}, {% endif %}
{% endfor %}
{% endif %}

{% if $document.footnotes %}
## Footnotes

{% for $footnote in $document.footnotes %}
[^{{ loop.index }}]: {{ $footnote }}
{% endfor %}
{% endif %}
```
