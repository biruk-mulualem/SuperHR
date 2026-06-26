<template>
  <BaseDocumentLayout>
    <div class="letter-content">
      <div class="ref-date">ቁጥር <strong>{{ formData.referenceNumber || '________' }}</strong> ቀን <strong>{{ formData.date || '________' }}</strong></div>
      <div class="letter-address">ለ <strong>{{ formData.companyName || '________' }}</strong><br/><strong>{{ formData.companyAddress || '________' }}</strong></div>
      <div class="letter-subject">ጉዳዩ : <strong>{{ formData.subject || '________' }}</strong></div>
      <p>በድርጅታችን ውስጥ ተቀጥረው እያገለገሉ ለሚኾኑት</p>
      <p>ለአቶ/ወ/ሮ/ወ/ሪት <strong>{{ employee?.fullName || '________' }}</strong> ቁጥር <strong>{{ employee?.idNumber || '________' }}</strong> በቀን <strong>{{ employee?.hireDate || '________' }}</strong> ዓ.ም ከማስረያ ቤታችን</p>
      <p>በተጻፈ ደብዳቤ <strong>{{ employee?.fullName || '________' }}</strong> ዋስትና መግባታቸው ይታወቃል።</p>
      <p>ሆኖም ግን በአንዳንድ ማስረያ ቤቶች ስም ተጽፈው የሚገኙ የዋስትና ደብዳቤዎችን ትክክለኛነት በምንጠይቅበት ወቅት ከመ/ቤታችን በትክክለኛው መንገድ ያልወጡ ሆነው አጋጥመውናል።</p>
      <p>ስለሆነም ይህንን ችግር ለማቃለል እና ህገወጥ ድርጊቱንም በጋራ ከወዲሁ ለማቆም እንድንችል የድርጅታችን ትብብር አስፈላጊ ሆኖ አግኝተናል።</p>
      <p>በዚህም ማስረጃ ቁጥሩና ቀኑ የተመቀሰውን ደብዳቤ ኮፒ የላኩን በሚኾኑት ደብዳቤው ከድርጅታችን ስለመውጣቱ ወይም ስለትክክለኛነቱ በሚገልጽልን አካል ፊርማ እና በድርጅቱ ማህተም እንድታረጋግጡልን ዘንድ በአክብሮት እንጠይቃለን።</p>
      <div class="signature-section">
        <p>ከሰላምታ ጋር</p>
        <p><strong>{{ formData.signature || '________' }}</strong></p>
        <p><strong>{{ formData.position || '________' }}</strong></p>
        <p><strong>{{ formData.companyName || '________' }}</strong></p>
      </div>
    </div>
  </BaseDocumentLayout>
</template>

<script setup>
import BaseDocumentLayout from './BaseDocumentLayout.vue'

const props = defineProps({
  employee: {
    type: Object,
    default: () => ({})
  },
  formData: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.letter-content .ref-date {
  text-align: right;
  margin-bottom: 30px;
}
.letter-content .letter-address,
.letter-content .letter-subject {
  margin: 20px 0;
}
.letter-content p {
  margin-bottom: 14px;
  text-align: justify;
}
.letter-content .signature-section {
  margin-top: 50px;
  text-align: right;
}
</style>