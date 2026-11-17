<template>
  <!-- Three steps in one row: the email, then (in a market with SMS set up)
       an offer to add a phone number, then the thank-you. Each replaces the
       last, heading included; errors go to a native alert so the row never
       reflows. Focus follows each step (the field it was in is gone). The
       sr-only region below is the one screen readers hear the thank-you
       from: it exists from the first render, which a status element that
       mounts with its text does not reliably get announced. -->
  <p
    v-if="step === 'done'"
    ref="successEl"
    tabindex="-1"
    class="text-base md:text-lg uppercase leading-none outline-none"
  >
    {{ $t('newsletter.success') }}
  </p>

  <template v-else-if="step === 'phone'">
    <form
      class="email-signup flex items-center gap-x-sm"
      novalidate
      :aria-busy="sending"
      @submit.prevent="submitPhone"
    >
      <label
        :for="phoneId"
        class="text-base md:text-lg uppercase leading-none flex-none sr-only lg:not-sr-only"
        >{{ $t('newsletter.smsHeading') }}</label
      >
      <input
        :id="phoneId"
        ref="phoneEl"
        v-model="phone"
        type="tel"
        name="phone"
        autocomplete="tel"
        required
        :placeholder="$t('newsletter.smsPlaceholder')"
        :disabled="sending"
        :aria-describedby="termsId"
        class="min-w-0 flex-1"
      />
      <button
        type="submit"
        :disabled="sending"
        class="text-base md:text-lg uppercase leading-none flex-none flex items-center gap-x-xs"
      >
        <span class="lg:sr-only">{{ $t('newsletter.subscribe') }}</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
    <!-- The consent disclosure SMS marketing requires, next to the field
         (and its description, so it's read with it). -->
    <p
      :id="termsId"
      class="text-xs mt-xs"
    >
      {{ $t('newsletter.smsTerms') }}
    </p>
    <button
      type="button"
      :disabled="sending"
      class="text-xs uppercase underline mt-xs"
      @click="finish"
    >
      {{ $t('newsletter.smsSkip') }}
    </button>
  </template>

  <form
    v-else
    class="email-signup flex items-center gap-x-sm"
    novalidate
    :aria-busy="sending"
    @submit.prevent="submit"
  >
    <!-- The visible heading doubles as the input's label; below lg it is
         sr-only rather than hidden, so the field keeps its name. -->
    <label
      :for="inputId"
      class="text-base md:text-lg uppercase leading-none flex-none sr-only lg:not-sr-only"
      >{{ $t('newsletter.heading') }}</label
    >
    <input
      :id="inputId"
      v-model="email"
      type="email"
      name="email"
      autocomplete="email"
      required
      :placeholder="$t('newsletter.placeholder')"
      :disabled="sending"
      class="min-w-0 flex-1"
    />
    <!-- Honeypot: off-screen and hidden from assistive tech, so only a bot
         filling every field puts anything in it. The server treats a
         non-empty value as spam. -->
    <input
      v-model="website"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="sr-only"
    />
    <!-- Named by its visible word at every width: word + arrow below lg,
         the arrow alone from lg with the word kept as sr-only text. -->
    <button
      type="submit"
      :disabled="sending"
      class="text-base md:text-lg uppercase leading-none flex-none flex items-center gap-x-xs"
    >
      <span class="lg:sr-only">{{ $t('newsletter.subscribe') }}</span>
      <span aria-hidden="true">→</span>
    </button>
  </form>

  <!-- The email is in from the phone step on, so the thank-you is announced
       there; the phone field taking focus then reads as the next offer. -->
  <p
    class="sr-only"
    aria-live="polite"
  >
    {{ step === 'email' ? '' : $t('newsletter.success') }}
  </p>
</template>

<script setup>
const { t, locale } = useI18n()
const inputId = useId()
const phoneId = useId()
const termsId = useId()

const email = ref('')
const website = ref('')
const phone = ref('')
const step = ref('email') // email | phone | done
const sending = ref(false)
const phoneEl = ref(null)
const successEl = ref(null)

// From /api/newsletter, only in a market with SMS set up; lets the phone
// step add a number to this email (server/utils/smsSignup.ts).
let smsToken = ''

// Set on the client: server-rendered time would count the whole page load
// as fill time and let a bot through the speed check.
let renderedAt = 0
onMounted(() => {
  renderedAt = Date.now()
})

const goTo = async (next, el) => {
  step.value = next
  await nextTick()
  el.value?.focus()
}

const finish = () => goTo('done', successEl)

const submit = async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
    window.alert(t('newsletter.invalid'))
    return
  }
  sending.value = true
  try {
    const res = await $fetch('/api/newsletter', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        website: website.value,
        elapsed: Date.now() - renderedAt,
        locale: locale.value,
      },
    })
    smsToken = res?.smsToken ?? ''
    sending.value = false
    if (smsToken) goTo('phone', phoneEl)
    else finish()
  } catch {
    sending.value = false
    window.alert(t('newsletter.error'))
  }
}

const submitPhone = async () => {
  if (phone.value.replace(/\D/g, '').length < 7) {
    window.alert(t('newsletter.smsInvalid'))
    return
  }
  sending.value = true
  try {
    await $fetch('/api/newsletter-sms', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        token: smsToken,
        phone: phone.value,
        locale: locale.value,
      },
    })
    sending.value = false
    finish()
  } catch (error) {
    sending.value = false
    // A number the server can't read gets the same message as one the
    // check above caught. Anything else: the email is in regardless, so
    // after saying so the form moves on rather than leave them stuck.
    if (error?.statusCode === 400) {
      window.alert(t('newsletter.smsInvalid'))
      phoneEl.value?.focus()
    } else {
      window.alert(t('newsletter.smsError'))
      finish()
    }
  }
}
</script>

<style scoped>
/* The underline runs under the whole row (input + subscribe) while the
   label is sr-only; from lg, where the label joins the row, it's under the
   input alone. Text fields match :focus-visible on click as well as on Tab
   (the browser assumes typing follows), so the ring would box every click —
   the underline brightens instead, still a visible indicator. */
.email-signup {
  border-bottom: 2px solid var(--color-grey-4);

  &:has(input:focus-visible) {
    border-color: var(--color-grey-1);
  }

  @media (width >= 1024px) {
    border-bottom: 0;
  }

  input {
    color: var(--color-grey-4);
    text-transform: uppercase;

    &::placeholder {
      color: var(--color-grey-4);
    }

    &:focus-visible {
      outline: none;
      border-color: var(--color-grey-1);
    }

    @media (width >= 1024px) {
      border-bottom: 2px solid var(--color-grey-4);
    }
  }
}

/* High contrast: the underline's focus brightening is gone (both greys turn
   the text color), so focus gets the site's ring back. */
html.high-contrast .email-signup input:focus-visible {
  outline: 0.2rem solid currentColor;
}
</style>
