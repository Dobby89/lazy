const { CreateEvent } = require('./lazy-events');
const onCompleteEventName = 'lazyloadcomplete';
const onErrorEventName = 'lazyloaderror';
const onComplete = CreateEvent(onCompleteEventName);
const onError = CreateEvent(onErrorEventName);

// takes either a single src for non picture elements or an array of srcs
// if a picture element the image argument is the image element from within the picture element
// otherwise its a dummy image object
// the load / error events are captured on both
function loadImage(src, image) {

	return new Promise(function(resolve, reject) {

		function onLoad() {
			removeListeners();
			resolve(true);
		}

		function onError() {
			removeListeners();
			reject(false);
		}

		function removeListeners() {
			image.removeEventListener('load', onLoad);
			image.removeEventListener('error', onError);
		}

		image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);

    // if the image is within a picture element, set srcset on each child
    // browsers that don't support the picture element will report it as an instance of a HTMLUnknownElement
    if(image.parentNode && image.parentNode.constructor === window.HTMLPictureElement ||
      image.parentNode && typeof window.HTMLPictureElement === 'undefined' && image.parentNode.constructor === HTMLUnknownElement) {

        Array.from(image.parentNode.children).forEach(function(child, i) {
          child.setAttribute('srcset', src[i]);
        });

    }
    else {
      image.setAttribute('src', src);
    }

	});

}

function lazyLoadImage() {

  const { image, src } = this;

  // create a dummy image to capture load / error events
  let lazyImage = new Image();

  // if it's a picture element, re-assign the dummy image as the img element within the picture element
  if(image.constructor === window.HTMLPictureElement ||
    typeof window.HTMLPictureElement === 'undefined' && image.constructor === HTMLUnknownElement) {
    lazyImage = image.querySelector('img');
  }

  // get the appropriate callback to fire once an image has loaded
	const onImageLoad = getOnLoadCallback(image);

	loadImage(src, lazyImage)
		.then(function() {
			onImageLoad(image, src);
			image.dispatchEvent(onComplete);
		})
		.catch(function() {
			image.dispatchEvent(onError);
		});

}

function getOnLoadCallback(image) {
	switch (true) {
		case image.constructor === HTMLImageElement:
      return onShowImage;
    case image.constructor !== window.HTMLPictureElement || image.constructor !== window.HTMLUnknownElement:
			return onShowBackgroundImage;
		default:
			return () => {}; // empty function callback for picture element
	}
}

function onShowImage(image, src) {
	image.setAttribute('src', src);
}

function onShowBackgroundImage(div, src) {
	div.style.backgroundImage = `url(${src})`;
}

module.exports = {
	lazyLoadImage,
	loadImage,
	getOnLoadCallback,
	onShowImage,
	onShowBackgroundImage
};
