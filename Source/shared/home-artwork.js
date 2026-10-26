// Home category tiles have their own artwork. Device uploads, featured choices,
// visibility and catalog order must never change a category's default picture.
const defaultImages = Object.freeze({
  phones: 'assets/devices/iphone-17-pro-max.webp',
  laptops: 'assets/devices/macbook-pro.webp',
  tablets: 'assets/devices/ipad.webp',
  watches: 'assets/devices/huawei-watch-gt6.webp',
  audio: 'assets/categories/airpods-pro.png',
  accessories: 'assets/devices/airtag.webp',
});

export const defaultCategoryImage = (id) => defaultImages[id] || '';

export function categoryArtworkSource(category, { photoUrl = () => '', assetUrl = (path) => path } = {}) {
  const photo = category?.photo ? photoUrl(category.photo) : '';
  if (photo) return { src: photo, custom: true };
  if (category?.image) return { src: assetUrl(category.image), custom: true };
  const image = defaultCategoryImage(category?.id);
  return { src: image ? assetUrl(image) : '', custom: false };
}
