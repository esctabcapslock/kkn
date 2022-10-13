# 관련 메모

## svg 파싱
```js
svg = document.querySelector('#map svg')
out = `<svg width="${svg.attributes.width.value}" height="${svg.attributes.height.value}" xmlns="http://www.w3.org/2000/svg" viewBox="${svg.attributes.viewBox.value}">${svg.innerHTML}</svg>`
copy(out)
```
