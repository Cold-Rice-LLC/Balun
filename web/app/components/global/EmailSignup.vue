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
    <SignupRow
      ref="phoneRow"
      v-model="phone"
      type="tel"
      name="phone"
      autocomplete="tel"
      :label="$t('newsletter.smsHeading')"
      :placeholder="$t('newsletter.smsPlaceholder')"
      :submit-label="$t('newsletter.subscribe')"
      :sending="sending"
      :describedby="termsId"
      @submit="submitPhone"
    />
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

  <SignupRow
    v-else
    v-model="email"
    v-model:honeypot="website"
    :label="$t('newsletter.heading')"
    :placeholder="$t('newsletter.placeholder')"
    :submit-label="$t('newsletter.subscribe')"
    :sending="sending"
    @submit="submit"
  />

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
const termsId = useId()

const email = ref('')
const website = ref('')
const phone = ref('')
const step = ref('email') // email | phone | done
const sending = ref(false)
const phoneRow = ref(null)
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
    if (smsToken) goTo('phone', phoneRow)
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
      phoneRow.value?.focus()
    } else {
      window.alert(t('newsletter.smsError'))
      finish()
    }
  }
}
</script>
