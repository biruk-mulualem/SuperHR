  <template>
  <div class="document-blueprint-package">
    
    <div class="print-container portrait-page">
      <div class="page-indicator-tag">ቅጽ፡ምስ፡1</div>

      <header class="header-blueprint">
        <div class="header-left-stack">
          <div class="crest-emblem-wrapper">
            <img class="logo" src="/src/assets/logo.PNG" alt="Emblem">
          </div>
          
          <h1 class="gov-title-main">በኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ <br> የግል ድርጅቶች ሠራተኞች ማኅበራዊ ዋስትና ኤጀንሲ</h1>

          <div class="pension-meta-box">
            <div class="meta-inline-row">
              <label class="field-label font-normal">የሠራተኛው ማህበር ፊርማ መለያ ቁጥር</label>
              <span class="line-medium" style="width: 100px;">
                {{ employee.employeeCode }}
              </span>
            </div>
            <div class="meta-inline-row margin-top-xs">
              <label class="field-label">*የአሠሪው መለያ ማህበር ክፍያ መለያ ቁጥር</label>
              <span class="data-text-fill line-medium text-center">
                {{ employee.currentCompany?.companyTin }}
              </span>
            </div>
          </div>
        </div>

        <div class="passport-photo-frame">
          <img v-if="employee.profilePictureUrl" :src="employee.profilePictureUrl" alt="Profile" class="photo-render" />
          <template v-else>የሠራተኛው/ዋ/<br>ፎቶግራፍ</template>
        </div>
      </header>

      <section class="document-title-banner">
        <h3 class="inner-form-title">በጡረታ ዕድሜ የተሰናበቱ ሠራተኞች የግል ፣ የአገልግሎትና የቤተሰብ ሁኔታ መግለጫ ፎርም</h3>
        <strong style="font-size:80%;display: block; width: 100%;  text-align: left; text-decoration: underline;">ማሳሰብያ፡</strong>
        <p class="top-instruction-copy">
          ይህ ቅጽ ሲሞላ በርዝራዥ መጻፍ የለበትም፤ በጠቋሚ ብዕርና በግልጽ ፊደላት ተሞልቶ መፈረም ይኖርበታል። በቲ ማህተም የተመሰረተ ተራ ቁጥር እየተሰጠው በየመዝገቡ መሠረት መመዝገብ ይችላል። በዚህ ቅጽ ላይ የሚመዘገበው ዘመነ ዓመት በሙሉ በኢትዮጵያ አቆጣጠር መሆን አለበት።
        </p>
      </section>

      <main class="form-sheet-body">
        
        <div class="form-row-line">
          <label class="field-label font-bold">1. <span class="asterisk">*</span>የመሥሪያ ቤቱ ስም</label>
          <span class="data-text-fill font-bold line-medium flex-grow padding-left-lg">
            {{ employee.currentCompany?.companyName }}
          </span>
        </div>
        
        <div class="form-row-line">
          <label class="field-label font-bold indent-level-1">ፖ.ሣ.ቁጥር</label>
          <span class="line-medium text-center font-bold">
            {{ employee.currentCompany?.poBox }}
          </span>
          <label class="field-label font-bold margin-left-xl"><span class="asterisk">*</span>ስልክ ቁጥር</label>
          <span class="data-text-fill font-bold line-medium width-140 text-center">
            {{ employee.currentCompany?.companyPhone }}
          </span>
        </div>

        <div class="section-header-row">
          <span class="section-header-text">ሀ/ የሠራተኛው/ዋ/ የግል ሁኔታ</span>
        </div>

        <div class="form-row-line">
          <label class="field-label font-bold">2. <span class="asterisk">*</span>ስም</label>
          <span class="data-text-fill font-bold line-medium width-120 padding-left-sm text-center">
            {{ employee.firstName }}
          </span>
          <label class="field-label font-bold margin-left-lg"><span class="asterisk">*</span>የአባት ስም</label>
          <span class="data-text-fill font-bold line-medium width-130 padding-left-sm text-center">
            {{ employee.middleName }}
          </span>
          <label class="field-label font-bold margin-left-lg"><span class="asterisk">*</span>የአያት ስም</label>
          <span class="data-text-fill font-bold line-medium width-140 padding-left-sm text-center">
            {{ employee.lastName }}
          </span>
        </div>

        <div class="form-row-line">
          <label class="field-label font-bold indent-level-1"><span class="asterisk">*</span>ጾታ</label>
          <span class="data-text-fill font-bold line-medium width-120 padding-left-sm text-center">
            {{ translateGender(employee.gender) }}
          </span>
          <label class="field-label font-bold margin-left-xl"><span class="asterisk">*</span>የእናት ሙሉ ስም</label>
          <span class="data-text-fill font-bold line-medium flex-grow padding-left-lg">
            {{ employee.mothersFullName }}
          </span>
        </div>

        <div class="form-row-line">
          <label class="field-label font-bold">3. <span class="asterisk">*</span>የልደት ዘመን፡ ቀን</label>
          <span class="data-text-fill font-bold line-medium width-50 text-center">
            {{ extractDatePart(employee.dateOfBirth, 'day') }}
          </span>
          <label class="field-label margin-left-xs">ወር</label>
          <span class="data-text-fill font-bold line-medium width-50 text-center">
            {{ extractDatePart(employee.dateOfBirth, 'month') }}
          </span>
          <label class="field-label margin-left-xs">ዓ.ም.</label>
          <span class="data-text-fill font-bold line-medium width-80 text-center">
            {{ extractDatePart(employee.dateOfBirth, 'year') }}
          </span>
          <label class="field-label font-bold margin-left-md">እ.ኤ.አ</label>
        </div>

        <div class="form-block-stack">
          <label class="field-label font-bold">4. <span class="asterisk">*</span>የኢትዮጵያ ዜግነት የተገኘበት ሁኔታ:-</label>
          <div class="checkbox-alignment-row indent-level-1">
            <span class="checkbox-item-wrapper" :class="{ 'weight-heavy': employee.nationalityAcquisition?.type === 'by_birth' }">
              <span class="vector-checkbox-box" :class="{ 'checked-box': employee.nationalityAcquisition?.type === 'by_birth' }">
                {{ employee.nationalityAcquisition?.type === 'by_birth' ? '✔' : '' }}
              </span> በትውልድ
            </span>
            <span class="checkbox-item-wrapper" :class="{ 'weight-heavy': employee.nationalityAcquisition?.type === 'by_law' }">
              <span class="vector-checkbox-box" :class="{ 'checked-box': employee.nationalityAcquisition?.type === 'by_law' }">
                {{ employee.nationalityAcquisition?.type === 'by_law' ? '✔' : '' }}
              </span> በሕግ ፈቃድ
            </span>
            <span class="checkbox-item-wrapper" :class="{ 'weight-heavy': employee.nationalityAcquisition?.type === 'ethiopian_birth' }">
              <span class="vector-checkbox-box" :class="{ 'checked-box': employee.nationalityAcquisition?.type === 'ethiopian_birth' }">
                {{ employee.nationalityAcquisition?.type === 'ethiopian_birth' ? '✔' : '' }}
              </span> ትውልደ ኢትዮጵያዊ
            </span>
          </div>
          <p class="nested-disclaimer-footnote indent-level-1 font-bold">(በሕግ ፈቃድ ከሆነ ማስረጃው ተያይዞ መቅረብ አለበት::)</p>
        </div>

        <div class="form-block-stack margin-top-sm">
          <label class="field-label font-bold font-size-mid">5. <span class="asterisk">*</span>አድራሻ (የሠራተኛው)</label>
          
          <div class="address-tabulated-container">
            <div class="form-row-line">
              <div class="half-width-column">
                <label class="field-label font-bold label-width-long"><span class="asterisk">*</span>ክልል (መስተዳድር)</label>
                <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm">
                  {{ employee.currentAddress?.region }}
                </span>
              </div>
              <div class="half-width-column padding-left-lg">
                <label class="field-label font-bold label-width-short"><span class="asterisk">*</span>ስልክ</label>
                <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm">
                  {{ employee.phoneNumber }}
                </span>
              </div>
            </div>

            <div class="form-row-line">
              <div class="half-width-column">
                <label class="field-label font-bold label-width-long"><span class="asterisk">*</span>ክፍለ ከተማ (ዞን)</label>
                <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm">
                  {{ employee.currentAddress?.subcity }}
                </span>
              </div>
              <div class="half-width-column padding-left-lg">
                <label class="field-label font-normal label-width-short">ቀበሌ</label>
                <span class="blank-line-fill flex-grow text-center font-bold">
                  {{ employee.currentAddress?.kebele }}
                </span>
              </div>
            </div>

            <div class="form-row-line">
              <div class="half-width-column">
                <label class="field-label font-bold label-width-long"><span class="asterisk">*</span>የከተማው ስም (ወረዳ)</label>
                <span class="data-text-fill font-bold line-medium flex-grow text-center margin-left-xs">
                  {{ employee.currentAddress?.district }}
                </span>
              </div>
              <div class="half-width-column padding-left-lg">
                <label class="field-label font-normal label-width-short">...ሣ.ቁ</label>
                <span class="blank-line-fill flex-grow text-center font-bold">
                  {{ employee.currentAddress?.poBox }}
                </span>
              </div>
            </div>

            <div class="form-row-line">
              <div class="half-width-column">
                <label class="field-label font-bold">E-mail</label>
                <span class="line-medium flex-grow padding-left-sm font-bold">
                  {{ employee.personalEmail || employee.workEmail }}
                </span>
              </div>
              <div class="half-width-column padding-left-lg">
                <label class="field-label font-bold label-width-short">የቤት ቁጥር</label>
                <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm text-center">
                  {{ employee.currentAddress?.houseNumber }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <footer class="legal-notice-footer">
        ማሳሰቢያ፡- ማናቸውም መረጃዎች በታማኝነት መሞላት ሲኖርባቸው፣ በሀሰተኛ የመረጃ አቀራረብ በሕግ ተጠያቂ ያደርጋል፡፡
      </footer>
    </div>

    <div class="print-container landscape-page">
      
      <div class="section-header-row margin-bottom-md">
        <span class="section-header-text font-size-lg">ለ/ የአገልግሎት ሁኔታ</span>
      </div>

      <main class="form-sheet-body">
        
        <div class="form-block-stack width-100-pc">
          <label class="field-label font-bold font-size-mid">6. አገልግሎት የተፈጸመባቸው መሥሪያ ቤቶች</label>
          
          <div class="form-block-stack margin-top-sm padding-left-md">
            <label class="field-label font-bold text-underline">6.1 የአሁኑ የአገልግሎት ሁኔታ</label>
            <div class="form-row-line margin-top-xs">
              <label class="field-label font-normal">ወርሃዊ ደሞዝ</label>
              <span class="data-text-fill font-bold line-medium width-150 text-center">
                {{ employee.basicSalary }}
              </span>
            </div>
          </div>

          <div class="form-block-stack margin-top-md padding-left-md width-100-pc">
            <label class="field-label font-bold text-underline">
              6.2 የተደራረበ የአገልግሎት ሁኔታ (የጡረታ መዋጮ የተከፈለባቸው አገልግሎቶችና የፕሮቪደንት ፈንድ ገቢ ከሆነ)
            </label>
            
            <table class="service-ledger-table margin-top-sm">
              <thead>
                <tr>
                  <th rowspan="2" class="th-seq">ተ.ቁ</th>
                  <th rowspan="2" class="th-tin">የድርጅቱ ግብር ከፋይ መለያ ቁጥር</th>
                  <th rowspan="2" class="th-org-name">የድርጅቱ ስም</th>
                  <th rowspan="2" class="th-srv-type">የአገልግሎት ዓይነት ሲቪል/ ውትድርና/ የግል ድርጅት/ ፕሮቪደንት ፈንድ</th>
                  <th colspan="2" class="th-span-group">በመንግስት እና በግል ድርጅት የተሰጠ አገልግሎት</th>
                  <th rowspan="2" class="th-salary">ወርሃዊ ደሞዝ</th>
                  <th rowspan="2" class="th-provident">አገልግሎት የሰጠበት ድርጅት መዋጮ ፕሮቪደንት ገቢ አድርጓል ወይም አልደረገም</th>
                  <th rowspan="2" class="th-reason">የተለቀቁበት ምክንያት</th>
                  <th rowspan="2" class="th-pension">በወቅቱ ይከፈል የነበረ የጡረታ</th>
                </tr>
                <tr>
                  <th class="th-sub-date">ከመቼ <br><span class="weight-light">ቀን/ወር/ዓ.ም</span></th>
                  <th class="th-sub-date">እስከ መቼ <br><span class="weight-light">ቀን/ወር/ዓ.ም</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(exp, index) in paddedWorkExperience" :key="index">
                  <td class="text-center font-bold">{{ exp.seq || '&nbsp;' }}</td>
                  <td class="text-center font-bold">{{ exp.companyTin }}</td>
                  <td class="padding-left-sm font-bold">{{ exp.companyName }}</td>
                  <td class="text-center font-bold">{{ exp.companyType }}</td>
                  <td class="text-center font-bold">{{ exp.startDate }}</td>
                  <td class="text-center font-bold">{{ exp.endDate }}</td>
                  <td class="text-center font-bold">{{ exp.monthlySalary }}</td>
                  <td class="text-center font-bold">{{ exp.providentFundSubmitted }}</td>
                  <td class="text-center font-bold">{{ exp.terminationReason }}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div class="landscape-footnote-area">
              <p class="footnote-item">
                <strong>ማሳሰቢያ፡- 1.</strong> የቅጥር፣ የአገልግሎት ማስረጃ፣ ቅድሚያ ያለው የሥራ መደብና የህይወት ታሪክ እዚህ ተያይዞ መቅረብ አለበት::
              </p>
            </div>
          </div>

        </div>
      </main>

      <footer class="legal-notice-footer">
        ማሳሰቢያ፡- ማናቸውም መረጃዎች በታማኝነት መሞላት ሲኖርባቸው፣ በሀሰተኛ የመረጃ አቀራረብ በሕግ ተጠያቂ ያደርጋል፡፡
      </footer>
    </div>

    <div class="print-container portrait-page">
      <div class="page-indicator-tag">ቅጽ፡ምስ፡1</div>
      
      <div class="section-c-header-container">
        <div class="section-c-title-area">
          <div class="section-header-row">
            <span class="section-header-text font-size-lg">ሐ/ የቤተሰብ ሁኔታ</span>
          </div>
          <div class="form-block-stack margin-top-md">
            <label class="field-label font-bold text-underline">i. ሚስት ወይም ባል (የጋብቻ ማስረጃ ተያይዞ ይቅረብ)</label>
          </div>
        </div>
        <div class="spouse-photo-frame">
          <img v-if="employee.spouseInfo?.profilePictureUrl" :src="employee.spouseInfo?.profilePictureUrl" alt="Spouse" class="photo-render" />
          <template v-else>የሚስት/የባል/<br>ፎቶግራፍ</template>
        </div>
      </div>

      <main class="form-sheet-body margin-top-xs">
        
        <div class="form-row-line">
          <label class="field-label font-bold">7. ስም</label>
          <span class="blank-line-fill flex-grow text-center font-bold">
            {{ employee.spouseInfo?.fullName || '' }}
          </span>
        </div>

        <div class="form-row-line">
          <label class="field-label font-bold">8. የሚስት/የባል የማህበር ክፍያ መለያ ቁጥር</label>
          <span class="blank-line-fill flex-grow text-center font-bold">
            {{ employee.spouseInfo?.tinNumber || '' }}
          </span>
        </div>
        
        <div class="form-row-line">
          <label class="field-label font-bold indent-level-1">የሚስት/የባል የልደት ዘመን፡ ቀን</label>
          <span class="blank-line-fill width-50 text-center font-bold">
            {{ extractDatePart(employee.spouseInfo?.dateOfBirth, 'day') }}
          </span>
          <label class="field-label margin-left-xs">ወር</label>
          <span class="blank-line-fill width-50 text-center font-bold">
            {{ extractDatePart(employee.spouseInfo?.dateOfBirth, 'month') }}
          </span>
          <label class="field-label margin-left-xs">ዓ.ም.</label>
          <span class="blank-line-fill width-80 text-center font-bold">
            {{ extractDatePart(employee.spouseInfo?.dateOfBirth, 'year') }}
          </span>
          <label class="field-label font-bold margin-left-md">(እ.ኤ.አ)</label>
        </div>

        <div class="form-block-stack margin-top-md width-100-pc">
          <label class="field-label font-bold text-underline">
            ii. ዕድሜያቸው ከ 18 ዓመት በታች የሆኑ ልጆች መረጃ (የአካል ጉዳተኛ ከሆነ ከ 21 ዓመት በታች)
          </label>
          
          <table class="children-matrix-table margin-top-sm">
            <thead>
              <tr>
                <th class="ch-seq">ተ.ቁ</th>
                <th class="ch-name">ስም የልጅ ሙሉ ስም</th>
                <th class="ch-dob">የልደት ዘመን <br><span class="weight-light">ቀን/ወር/ዓ.ም</span></th>
                <th class="ch-gender">ጾታ</th>
                <th class="ch-disability">የአካል/ የአዕምሮ ጉዳት አለበት/ የለበትም</th>
                <th class="ch-learning">የጉዲፈቻ ልጅ ነው/ አይደለም</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(child, idx) in paddedChildren" :key="idx">
                <td class="text-center font-bold">{{ child.seq || '&nbsp;' }}</td>
                <td class="padding-left-sm font-bold">{{ child.name }}</td>
                <td class="text-center font-bold">{{ child.dateOfBirth }}</td>
                <td class="text-center font-bold">{{ translateGender(child.gender) }}</td>
                <td class="text-center font-bold">{{ child.hasMedicalCondition }}</td>
                <td class="text-center font-bold">{{ child.isAdopted }}</td>
              </tr>
            </tbody>
          </table>

          <div class="table-disclaimer-box margin-top-xs">
            <p class="nested-disclaimer-footnote font-bold">ማሳሰቢያ፡- 1. የልደት ምስክር ወረቀት ተያይዞ ይቅረብ::</p>
            <p class="nested-disclaimer-footnote font-bold">2. የጉዲፈቻ ልጅ ከሆነ የፍርድ ቤት ውሳኔ ተያይዞ መቅረብ ይኖርበታል።</p>
            <p class="nested-disclaimer-footnote font-bold">3. የአካል/የአዕምሮ ጉዳት ካለበት ማረጋገጫ ይቅረብ::</p>
          </div>
        </div>

        <div class="section-header-row margin-top-md">
          <span class="section-header-text font-size-mid">በሕይወት ያሉ ወላጆች</span>
        </div>

        <div class="form-block-stack margin-top-xs width-100-pc">
          <label class="field-label font-bold">9. የአባት</label>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-bold">ሙሉ ስም</label>
            <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm">
              {{ employee.parentsInfo?.father?.fullName }}
            </span>
          </div>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-normal">ወርሃዊ ገቢ</label>
            <span class="blank-line-fill width-180 text-center font-bold">
              {{ employee.parentsInfo?.father?.monthlyIncome }}
            </span>
            <label class="field-label font-normal margin-left-xl">የመተዳደሪያ ሁኔታ (ሥራ)</label>
            <span class="blank-line-fill flex-grow text-center font-bold">
              {{ employee.parentsInfo?.father?.job }}
            </span>
          </div>
        </div>

        <div class="form-block-stack margin-top-sm width-100-pc">
          <label class="field-label font-bold">10. የእናት</label>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-bold">ሙሉ ስም</label>
            <span class="data-text-fill font-bold line-medium flex-grow padding-left-sm">
              {{ employee.parentsInfo?.mother?.fullName }}
            </span>
          </div>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-normal">ወርሃዊ ገቢ</label>
            <span class="blank-line-fill width-180 text-center font-bold">
              {{ employee.parentsInfo?.mother?.monthlyIncome }}
            </span>
            <label class="field-label font-normal margin-left-xl">የመተዳደሪያ ሁኔታ (ሥራ)</label>
            <span class="blank-line-fill flex-grow text-center font-bold">
              {{ employee.parentsInfo?.mother?.job }}
            </span>
          </div>
        </div>

        <div class="form-block-stack margin-top-sm width-100-pc">
          <label class="field-label font-bold">11. ወላጆች የማይኖሩበት ወይም የገቢ ሁኔታ መግለጫ</label>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-normal">የፋይናንስ ድጋፍ መግለጫ፡</label>
            <span class="blank-line-fill flex-grow padding-left-sm font-bold">
              {{ employee.parentsInfo?.financialSupport || 'የለም' }}
            </span>
          </div>
          <div class="form-row-line padding-left-md margin-top-xs">
            <label class="field-label font-normal">ሌሎች ተጨማሪ ድጋፎች፡</label>
            <span class="blank-line-fill flex-grow padding-left-sm font-bold">
              {{ employee.parentsInfo?.otherSupport || 'የለም' }}
            </span>
          </div>
        </div>

        <div class="form-block-stack margin-top-md width-100-pc declaration-container">
          <p class="footnote-item font-bold">ከዚህ በላይ የተገለጸው ትክክለኛ መሆኑን አረጋግጣለሁ::</p>
          <div class="form-row-line margin-top-sm">
            <label class="field-label font-normal">የሠራተኛው/ዋ/ ሙሉ ስም</label>
            <span class="blank-line-fill flex-grow padding-left-md font-bold">
              {{ employeeFullName }}
            </span>
          </div>
          <div class="form-row-line margin-top-sm">
            <label class="field-label font-normal">ፊርማ</label>
            <span class="blank-line-fill flex-grow"></span>
          </div>
          <div class="form-row-line margin-top-sm">
            <label class="field-label font-normal">ቀን</label>
            <span class="blank-line-fill width-220"></span>
          </div>
        </div>

      </main>

      <footer class="legal-notice-footer">
        ማሳሰቢያ፡- ማናቸውም መረጃዎች በታማኝነት መሞላት ሲኖርባቸው፣ በሀሰተኛ የመረጃ አቀራረብ በሕግ ተጠያቂ ያደርጋል፡፡
      </footer>
    </div>

    <div class="print-container portrait-page">
      <div class="page-indicator-tag">ቅጽ፡ምስ፡1</div>

      <div class="section-header-row margin-bottom-md">
        <span class="section-header-text font-size-lg">መ/ በአሠሪው መ/ቤት የሚሞላ</span>
      </div>

      <main class="form-sheet-body">
        
        <div class="employer-verification-text-block">
          <div class="form-row-line line-height-loose">
            <label class="field-label font-normal">አቶ/ወ/ሮ/ት</label>
            <span class="data-text-fill font-bold line-medium width-220 padding-left-sm text-center">
              {{ employeeFullName }}
            </span>
            <label class="field-label font-normal margin-left-xs">ከ</label>
            <span class="data-text-fill font-bold line-medium width-50 text-center">
              {{ extractDatePart(employee.hireDate, 'day') }}
            </span>
            <label class="field-label font-normal margin-left-xs">ቀን</label>
            <span class="data-text-fill font-bold line-medium width-50 text-center">
              {{ extractDatePart(employee.hireDate, 'month') }}
            </span>
            <label class="field-label font-normal margin-left-xs">ወር</label>
            <span class="data-text-fill font-bold line-medium width-80 text-center">
              {{ extractDatePart(employee.hireDate, 'year') }}
            </span>
            <label class="field-label font-normal margin-left-xs">ዓ.ም. (እ.ኤ.አ) ጀምሮ</label>
          </div>
          <div class="form-row-line margin-top-sm">
            <label class="field-label font-normal">በመሥሪያ ቤታችን እያገለገሉ መሆናቸውን እናረጋግጣለን::</label>
          </div>
        </div>

        <div class="sign-seal-matrix-row margin-top-xl">
          <div class="stamp-box-frame">
            *ማህተም
          </div>
          <div class="manager-signature-line-block">
            <span class="blank-line-fill width-250"></span>
            <label class="field-label font-bold margin-top-xs text-center width-250">*የኃላፊው ስምና ፊርማ</label>
          </div>
        </div>

        <div class="form-row-line margin-top-lg justify-end">
          <label class="field-label font-normal">ቀን</label>
          <span class="blank-line-fill width-180"></span>
        </div>

        <div class="agency-bordered-box margin-top-xl">
          <h4 class="agency-box-title text-center font-bold">በግል ድርጅቶች ሠራተኞች ማኅበራዊ ዋስትና ኤጀንሲ የሚሞላ</h4>
          
          <div class="agency-checklist-stack margin-top-md">
            <div class="checklist-row">
              <span class="checklist-item-text font-normal">1. ማህደር ተከፍቷል</span>
              <span class="vector-square-box"></span>
            </div>
            <div class="checklist-row">
              <span class="checklist-item-text font-normal">2. መረጃው በኮምፒውተር ተመዝግቧል::</span>
              <span class="vector-square-box"></span>
            </div>
            <div class="checklist-row">
              <span class="checklist-item-text font-normal">3. ተፈላጊ ማስረጃዎች ቀርበዋል</span>
              <span class="vector-square-box"></span>
            </div>
            <div class="checklist-row">
              <span class="checklist-item-text font-normal">4. ቅጽ-ምስ-1.1 ለአሠሪው መሥሪያ ቤት ተልኳል::</span>
              <span class="vector-square-box"></span>
            </div>
          </div>

          <div class="agency-officer-metadata margin-top-xl">
            <div class="form-row-line margin-top-sm">
              <label class="field-label font-normal min-label-width">የምዝገባ ኦፊሰር ሙሉ ስም</label>
              <span class="blank-line-fill flex-grow"></span>
            </div>
            <div class="form-row-line margin-top-md">
              <label class="field-label font-normal min-label-width">ፊርማ</label>
              <span class="blank-line-fill flex-grow"></span>
            </div>
            <div class="form-row-line margin-top-md">
              <label class="field-label font-normal min-label-width">ቀን</label>
              <span class="blank-line-fill flex-grow"></span>
            </div>
          </div>
        </div>

      </main>

      <footer class="legal-notice-footer">
        ማሳሰቢያ፡- ማናቸውም መረጃዎች በታማኝነት መሞላት ሲኖርባቸው፣ በሀሰተኛ የመረጃ አቀራረብ በሕግ ተጠያቂ ያደርጋል፡፡
      </footer>
    </div>

  </div>
</template>

<script>
export default {
  name: "DocumentLetter",
  props: {
    formData: {
      type: Object,
      default: () => ({})
    },
    employee: {
      type: Object,
      default: () => ({
        employeeId: 1042,
        employeeCode: "P-048291",
        firstName: "አሸናፊ",
        middleName: "ንጉሴ",
        lastName: "በዘአብ",
        dateOfBirth: "1978-10-12", // YYYY-MM-DD standard DB format
        gender: "male",
        mothersFullName: "አለማሽ ዘሪሁን ሙላት",
        phoneNumber: "0911689799",
        personalEmail: "ashu.nigusse@gmail.com",
        workEmail: "ashenafi.n@superdinq.com",
        hireDate: "2018-04-25",
        basicSalary: "12000.00",
        profilePictureUrl: "", // URL string if exists from cloud storage
        
        nationalityAcquisition: {
          type: "by_birth", // 'by_birth', 'by_law', 'ethiopian_birth'
          documentUrl: ""
        },
        
        currentAddress: {
          region: "አዲስ አበባ",
          subcity: "ንፋስ ስልክ ላፍቶ",
          district: "12", // ወረዳ
          kebele: "04",
          poBox: "4192",
          houseNumber: "1052"
        },
        
        currentCompany: {
          companyName: "ሱፐር ድንቅ ቴክኖሎጂ ትሬዲንግ ኃ/የተ/የግ ማህበር",
          companyTin: "0003600429",
          companyPhone: "011-3-66-22-18",
          poBox: "8840",
          companyEmail: "info@superdinq.com"
        },
        
        // Array mapping onto Section 6.2 (Landscape ledger table)
        workExperience: [
          {
            companyTin: "0014829301",
            companyName: "አዋሽ ባንክ አ.ማ",
            companyType: "የግል ድርጅት",
            startDate: "12/02/2010",
            endDate: "15/08/2014",
            monthlySalary: "6500.00",
            providentFundSubmitted: "አድርጓል",
            terminationReason: "በገዛ ፈቃድ"
          },
          {
            companyTin: "0039281044",
            companyName: "ኢትዮ ቴሌኮም",
            companyType: "መንግስት",
            startDate: "01/09/2014",
            endDate: "20/03/2018",
            monthlySalary: "9800.00",
            providentFundSubmitted: "አልደረገም",
            terminationReason: "የሥራ ውል ማብቃት"
          }
        ],
        
        spouseInfo: {
          fullName: "ራሄል በቀለ ወልደማርያም",
          tinNumber: "0024910394",
          dateOfBirth: "1984-05-18",
          profilePictureUrl: ""
        },
        
        // Array mapping onto section ii Children table
        children: [
          {
            name: "ናሆም አሸናፊ ንጉሴ",
            dateOfBirth: "12/04/2015",
            gender: "male",
            hasMedicalCondition: "የለበትም",
            isAdopted: "አይደለም"
          },
          {
            name: "ኤልሳቤጥ አሸናፊ ንጉሴ",
            dateOfBirth: "30/11/2019",
            gender: "female",
            hasMedicalCondition: "የለበትም",
            isAdopted: "አይደለም"
          }
        ],
        
        parentsInfo: {
          father: {
            fullName: "ንጉሴ በዘአብ ወንድሙ",
            monthlyIncome: "3500.00",
            job: "የመንግስት ጡረተኛ"
          },
          mother: {
            fullName: "አለማሽ ዘሪሁን ሙላት",
            monthlyIncome: "0.00",
            job: "የቤት እመቤት"
          },
          financialSupport: "በየወሩ ለህክምና መግዣ የገንዘብ ድጋፍ ይደረግላቸዋል::",
          otherSupport: "የመኖሪያ ቤት ኪራይ ክፍያ እገዛ ያገኛሉ::"
        }
      }
      })
    }
  }
  computed: {
    // Generates a clean full name dynamically mapping the helper logic in your sequelize model
    employeeFullName() {
      const f = this.employee.firstName || '';
      const m = this.employee.middleName ? this.employee.middleName + ' ' : '';
      const l = this.employee.lastName || '';
      return `${f} ${m}${l}`.trim();
    },
    
    // Generates exactly 7 rows for Landscape Ledger table, padding empty slots if array length is less
    paddedWorkExperience() {
      const rows = [];
      const maxRows = 7;
      const actualData = this.employee.workExperience || [];
      
      for (let i = 0; i < maxRows; i++) {
        if (i < actualData.length) {
          rows.push({ seq: i + 1, ...actualData[i] });
        } else {
          rows.push({
            seq: "", companyTin: "", companyName: "", companyType: "",
            startDate: "", endDate: "", monthlySalary: "",
            providentFundSubmitted: "", terminationReason: ""
          });
        }
      }
      return rows;
    },
    
    // Generates exactly 4 rows for Children matrix layout to preserve precise physical sheet height
    paddedChildren() {
      const rows = [];
      const maxRows = 4;
      const actualData = this.employee.children || [];
      
      for (let i = 0; i < maxRows; i++) {
        if (i < actualData.length) {
          rows.push({ seq: i + 1, ...actualData[i] });
        } else {
          rows.push({
            seq: "", name: "", dateOfBirth: "", gender: "",
            hasMedicalCondition: "", isAdopted: ""
          });
        }
      }
      return rows;
    }
  }
  methods: {
    // Standard Amharic Gender Translation utility mapping DB Enums safely
    translateGender(val) {
      if (!val) return "";
      const lower = val.toLowerCase();
      if (lower === "male") return "ወንድ";
      if (lower === "female") return "ሴት";
      return "ሌላ";
    },
    
    // Elegant utility to split DB string dates cleanly into separate printable form line segments
    extractDatePart(dateString, part) {
      if (!dateString) return "";
      const parts = dateString.split("-"); // Expects YYYY-MM-DD
      if (parts.length !== 3) return "";
      
      if (part === "year") return parts[0];
      if (part === "month") return parts[1];
      if (part === "day") return parts[2];
      return "";
    }
  }
};
</script>

<style scoped>
/* ==========================================================================
   1. Multi-Page Canvas Global Standard Architecture 
   ========================================================================== */
.document-blueprint-package {
  background-color: transparent;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.print-container {
  box-sizing: border-box;
  background-color: #ffffff;
  color: #000000;
  font-family: 'Nyala', 'Abyssinica SIL', 'Segoe UI', sans-serif;
  position: relative;
  -webkit-font-smoothing: antialiased;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

.portrait-page {
  width: 210mm;
  min-height: 297mm;
  padding: 15mm 18mm 20mm 18mm;
  display: flex;
  flex-direction: column;
}

.landscape-page {
  width: 297mm;
  min-height: 210mm;
  padding: 20mm 18mm 18mm 18mm;
  display: flex;
  flex-direction: column;
}

.page-indicator-tag {
  position: absolute;
  top: 15mm;
  right: 18mm;
  font-size: 14px;
  font-weight: 800;
  color: #000000;
}

/* ==========================================================================
   2. Typography Standards
   ========================================================================== */
.font-bold { font-weight: 800; }
.font-normal { font-weight: 400; }
.font-size-mid { font-size: 15.5px; }
.font-size-lg { font-size: 17px; }
.text-underline { text-decoration: underline; text-underline-offset: 3px; }
.text-center { text-align: center; }
.weight-light { font-weight: 400; font-size: 11px; }
.line-height-loose { line-height: 2; }

.asterisk {
  font-weight: 800;
  color: #000000;
  margin-right: 2px;
}

/* ==========================================================================
   3. Corporate/Government Letterheads 
   ========================================================================== */
.header-blueprint {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 26px;
}

.header-left-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-grow: 1;
  padding-left: 60px;
}

.logo { 
  width: 0.94in; 
  height: 0.92in; 
  object-fit: contain; 
  display: block; 
  margin: 0 auto 6px auto; 
}

.gov-title-main {
  font-size: 20px;
  font-weight: 800;
  color: #000000;
  margin: 0;
  letter-spacing: -0.2px;
  transform: scaleX(0.96);
}

.gov-title-sub {
  font-size: 16.5px;
  font-weight: 800;
  color: #000000;
  margin: 4px 0 0 0;
  transform: scaleX(0.96);
}

.pension-meta-box {
  border: 1px solid #000000;
  padding: 10px 14px;
  width: 400px;
  margin-top: 16px;
  align-self: flex-start;
  text-align: left;
  box-sizing: border-box;
  background-color: #ffffff;
}

.meta-inline-row {
  display: flex;
  align-items: flex-end;
  font-size: 13.5px;
}

.passport-photo-frame,
.spouse-photo-frame {
  border: 2px solid #000000;
  width: 115px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
  background-color: #ffffff;
  flex-shrink: 0;
  color: #000000;
  overflow: hidden;
}

.photo-render {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.passport-photo-frame { margin-top: 60px; }

.document-title-banner {
  text-align: center;
  margin-bottom: 24px;
}

.inner-form-title {
  font-size: 16px;
  font-weight: 800;
  color: #000000;
  text-underline-offset: 4px;
  line-height: 1.4;
}

.top-instruction-copy {
  font-size: 12.5px;
  font-style: italic;
  text-align: justify;
  width: 80%;
  margin: 0 auto;
  line-height: 1.6;
  color: #000000;
}

/* ==========================================================================
   4. Form Elements & Alignment
   ========================================================================== */
.form-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-grow: 1;
}

.form-row-line {
  display: flex;
  align-items: flex-end;
  font-size: 14.5px;
  width: 100%;
}

.form-block-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 14.5px;
}

.field-label {
  white-space: nowrap;
  margin-right: 6px;
  color: #000000;
}

.indent-level-1 { padding-left: 45px; }
.width-100-pc   { width: 100%; }
.justify-end    { justify-content: flex-end; }

.address-tabulated-container {
  padding-left: 35px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.half-width-column {
  display: flex;
  align-items: flex-end;
  width: 50%;
  box-sizing: border-box;
}

.label-width-long  { width: 140px; flex-shrink: 0; }
.label-width-short { width: 80px; flex-shrink: 0; }

/* Micro Margins & Padding Controls */
.margin-left-xs   { margin-left: 8px; }
.margin-left-md   { margin-left: 14px; }
.margin-left-lg   { margin-left: 22px; }
.margin-left-xl   { margin-left: 42px; }
.margin-top-xs    { margin-top: 8px; }
.margin-top-sm    { margin-top: 10px; }
.margin-top-md    { margin-top: 16px; }
.margin-top-lg    { margin-top: 24px; }
.margin-top-xl    { margin-top: 40px; }
.margin-bottom-md { margin-bottom: 16px; }

.padding-left-md  { padding-left: 18px; }
.padding-left-lg  { padding-left: 28px; }
.padding-left-sm  { padding-left: 10px; }

/* Forms Line Components */
.data-text-fill { color: #000000; line-height: 20px; padding-bottom: 1px; }
.blank-line-fill { border-bottom: 1.5px dotted #000000; height: 20px; display: inline-block; }
.line-thick { border-bottom: 2px solid #000000; }
.line-medium { border-bottom: 1.5px solid #000000; }

.flex-grow   { flex-grow: 1; }
.width-250   { width: 250px; }
.width-220   { width: 220px; }
.width-180   { width: 180px; }
.width-150   { width: 150px; }
.width-140   { width: 140px; }
.width-130   { width: 130px; }
.width-120   { width: 120px; }
.width-80    { width: 80px; }
.width-50    { width: 50px; }

.section-header-row {
  border-bottom: 1px solid #000000;
  margin-top: 12px;
  margin-bottom: 4px;
  width: max-content;
}

.section-header-text {
  font-size: 15px;
  font-weight: 800;
  color: #000000;
  padding-bottom: 1px;
}

/* Vector Checkbox System */
.checkbox-alignment-row {
  display: flex;
  gap: 36px;
  margin-top: 10px;
}

.checkbox-item-wrapper {
  display: flex;
  align-items: center;
  font-size: 14.5px;
  color: #000000;
}

.vector-checkbox-box {
  width: 15px;
  height: 15px;
  border: 1.5px solid #000000;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background-color: #ffffff;
}

.weight-heavy { font-weight: 800; }
.nested-disclaimer-footnote { font-size: 12px; font-style: italic; margin: 4px 0 0 0; color: #000000; }

/* ==========================================================================
   5. Page 2 Landscape Ledger Table Architecture
   ========================================================================== */
.service-ledger-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  box-sizing: border-box;
}

.service-ledger-table th,
.service-ledger-table td {
  border: 1.5px solid #000000;
  color: #000000;
  vertical-align: middle;
  box-sizing: border-box;
}

.service-ledger-table th {
  background-color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  padding: 6px 3px;
  line-height: 1.3;
}

.th-seq        { width: 3.5%; }
.th-tin        { width: 11%; }
.th-org-name   { width: 16%; }
.th-srv-type   { width: 16%; }
.th-span-group { width: 18%; }
.th-sub-date   { width: 9%; }
.th-salary     { width: 8%; }
.th-provident  { width: 11%; }
.th-reason     { width: 8.5%; }
.th-pension    { width: 8%; }

.service-ledger-table tbody tr { height: 26px; }
.service-ledger-table tbody td { padding: 0 4px; font-size: 12.5px; }

/* Fixed Footnote Area on Page 2 */
.landscape-footnote-area { 
  width: 100%; 
  margin-top: 15px; 
}
.footnote-item { font-size: 12.5px; margin: 0; color: #000000; text-align: left; }

/* ==========================================================================
   6. Page 3 Specific Portrait Layout Matrix Elements
   ========================================================================== */
.section-c-header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.section-c-title-area {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

/* Children Matrix Table Styles */
.children-matrix-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  box-sizing: border-box;
}

.children-matrix-table th,
.children-matrix-table td {
  border: 1.5px solid #000000;
  color: #000000;
  vertical-align: middle;
  box-sizing: border-box;
}

.children-matrix-table th {
  background-color: #ffffff;
  font-size: 11.5px;
  font-weight: 800;
  text-align: center;
  padding: 6px 3px;
  line-height: 1.3;
}

.ch-seq        { width: 5%; }
.ch-name       { width: 28%; }
.ch-dob        { width: 17%; }
.ch-gender     { width: 10%; }
.ch-disability { width: 22%; }
.ch-learning   { width: 18%; }

.children-matrix-table tbody tr { height: 28px; }
.children-matrix-table tbody td { padding: 0 4px; font-size: 13px; }

.table-disclaimer-box { display: flex; flex-direction: column; gap: 2px; }
.declaration-container { border: 1.5px dashed #000000; padding: 12px; box-sizing: border-box; width: 100%; }

/* ==========================================================================
   7. Page 4 Specific Form Verification Structural Styles
   ========================================================================== */
.employer-verification-text-block {
  width: 100%;
  box-sizing: border-box;
  text-align: justify;
}

.sign-seal-matrix-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}

.stamp-box-frame {
  border: 1.5px dashed #000000;
  width: 160px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #000000;
  background-color: #ffffff;
}

.manager-signature-line-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Agency Internal Processing Container System */
.agency-bordered-box {
  border: 2px solid #000000;
  padding: 22px 20px;
  box-sizing: border-box;
  width: 100%;
  background-color: #ffffff;
}

.agency-box-title {
  margin: 0 0 20px 0;
  font-size: 15.5px;
  letter-spacing: -0.2px;
}

.agency-checklist-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.checklist-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 14.5px;
  padding-right: 15px;
  box-sizing: border-box;
}

.vector-square-box {
  width: 18px;
  height: 18px;
  border: 1.5px solid #000000;
  background-color: #ffffff;
  display: inline-block;
  flex-shrink: 0;
}

.agency-officer-metadata {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.min-label-width {
  min-width: 160px;
}

/* ==========================================================================
   8. Global Light Gray Footer Configuration
   ========================================================================== */
.legal-notice-footer {
  border-top: none;
  padding-top: 14px;
  font-size: 12.5px;
  font-weight: 800;
  text-align: center;
  color: #7f7f7f;
  line-height: 1.5;
  margin-top: auto;
}

/* ==========================================================================
   9. Hardware Printer Control Overrides 
   ========================================================================== */
@media print {
  body {
    background: none !important;
    margin: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .document-blueprint-package {
    background: none !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  
  .print-container {
    box-shadow: none !important;
    margin: 0 !important;
    page-break-inside: avoid !important;
  }

  .portrait-page {
    width: 210mm !important;
    height: 297mm !important;
    padding: 15mm 18mm 20mm 18mm !important;
    page-break-after: always !important;
  }

  .landscape-page {
    width: 297mm !important;
    height: 210mm !important;
    padding: 20mm 18mm 18mm 18mm !important;
    page-break-before: always !important;
    page-break-after: always !important;
  }

  @page {
    size: portrait;
    margin: 0;
  }
  
  .landscape-page {
    @page {
      size: landscape;
    }
  }
}
</style>

