// This file is used to import Swiper JS library and is required for Swiper to work.
;(() => {
  requestAnimationFrame(() => {
    import('swiper/element/bundle').then(({ register }) => {
      requestAnimationFrame(() => {
        register()
      })
    })
  })
})()
