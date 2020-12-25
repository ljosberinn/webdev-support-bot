export const sass: [string, string] = [
  'sass',
  `
  Sass (and Less and Stylus and other custom languages that compile to CSS) have some design flaws that end up limiting what you can do with CSS. If you have a codebase that still depends on them it would be a good time to isolate and minimize the code you have that uses them and strategize how you'll migrate away from them. If your project doesn't have have them, or you haven't yet learned them - it might be a good idea, thinking ahead, to just skip that and get into a pure CSS workflow. Don't worry, you can still preprocess CSS, the secret is writing and handling valid CSS at every step in your workflow so all the tools work together
Some flaws Sass has that get in the way:

- It's not actually compatible with CSS syntax. It's not a super-set, it's an entirely different syntax and because it's incompatible with real CSS, there's an infinite variety of things you might have or want in CSS that can't even be present in any stylesheet Sass looks at

- Some of the things Sass adds to its custom syntax are things CSS has a native syntax for, some of these understood by browsers or are things we have no doubt browsers aim to support, but to use Sass (or any other language) to provide these features means you'll be supporting those styles yourself forever

- Sass (and all preprocessors) are only capable of making ahead-of-time optimizations, and the power of what they can do ends before the CSS stylesheet they output is in the browser - if you look at where modern CSS tooling is at today there's a lot happening in browsers as well. Only CSS works in browsers, so by using Sass at all you're taking steps away from these other tools that are more and more useful as we build more complex things

- Ultimately Sass leads to you extend CSS (and thus think about CSS) using terms and things that aren't in CSS, so it can make it harder to reason about what you're actually needing to get done. For example, CSS has custom properties and custom functions, Sass has 'mixins'. What's a mixin? In the present where we can define custom properties, and in the future when we can define custom functions, which 'mixins' from Sass should be custom properties, and which should be functions? Etc. It's not leading you to reason better about extending CSS, it's actually teaching you a different language and as time moves on, its mechanisms for extending itself are a lot weaker than the things CSS already has, and the ways they will be made customizable (i.e. it doesn't look like the shape of what CSS can do)
It leads you to imperative solutions to extending a declarative language (to put it into programming terms), it's like writing macros to output huge amounts of for loops in another language, instead of writing some kind of higher-level abstraction in that other language that wouldn't require those for loops to exist at all to get the job done
  `.trim(),
];
