window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    document.body.style.filter = 'none';

    if (document.getElementById('thumbnail-gallery') && document.getElementById('video-gallery')) {
        const galleryLoadDelay = 200;

        setTimeout(() => {
            loadThumbnails();
            loadVideos();
        }, galleryLoadDelay);
    }
});

async function loadThumbnails() {
    const gallery = document.getElementById('thumbnail-gallery');
    if (!gallery) return;
    gallery.innerHTML = ''; 

    try {
        const response = await fetch('thumbnails/thumbnails.txt');
        if (!response.ok) throw new Error(`Failed to fetch thumbnails.txt: ${response.status}`);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            gallery.innerHTML = '<p class="placeholder-text"><code>thumbnails/thumbnails.txt</code> is empty.</p>';
            return;
        }

        let loadedItemCount = 0; 

        lines.forEach((line) => { 
            const parts = line.split(/\s+/);
            const imageUrl = parts.shift();
            let captionString = parts.join(' ').trim();

            if (!imageUrl) {
                console.warn(`Skipping line with no image URL: ${line}`);
                return;
            }

            const itemDiv = document.createElement('div');
            itemDiv.className = 'thumbnail-item';

            const imageWrapperDiv = document.createElement('div');
            imageWrapperDiv.className = 'thumbnail-image-wrapper';

            const img = document.createElement('img');
            
            const completeItemSetupAndAnimate = () => {
                imageWrapperDiv.appendChild(img);
                itemDiv.appendChild(imageWrapperDiv);

                if (captionString) {
                    const captionDiv = document.createElement('div');
                    captionDiv.className = 'thumbnail-caption';
                    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
                    let lastIndex = 0;
                    let tempFragment = document.createDocumentFragment();
                    captionString.replace(linkRegex, (match, linkText, linkUrl, offset) => {
                        if (offset > lastIndex) {
                            tempFragment.appendChild(document.createTextNode(captionString.substring(lastIndex, offset)));
                        }
                        const linkElement = document.createElement('a');
                        linkElement.href = linkUrl;
                        linkElement.textContent = linkText;
                        linkElement.target = "_blank";
                        tempFragment.appendChild(linkElement);
                        lastIndex = offset + match.length;
                        return match;
                    });
                    if (lastIndex < captionString.length) {
                        tempFragment.appendChild(document.createTextNode(captionString.substring(lastIndex)));
                    }
                    if (tempFragment.childNodes.length > 0) {
                        captionDiv.appendChild(tempFragment);
                        itemDiv.appendChild(captionDiv);
                    } else if (!captionString.match(linkRegex) && captionString) {
                         captionDiv.textContent = captionString;
                         itemDiv.appendChild(captionDiv);
                    }
                }
                gallery.appendChild(itemDiv);

                const itemStaggerDelay = loadedItemCount * 0.12; 
                itemDiv.style.transitionDelay = `${itemStaggerDelay}s`;
                
                requestAnimationFrame(() => { 
                   requestAnimationFrame(() => { 
                       itemDiv.classList.add('item-loaded');
                   });
                });
                loadedItemCount++; 
            };

            img.onload = () => {
                img.alt = `Thumbnail` + (captionString ? `: ${captionString.substring(0,30)}...` : '');
                completeItemSetupAndAnimate();
            };

            img.onerror = () => {
                console.error(`Failed to load image: ${imageUrl}`);
                img.alt = `Error loading: ${imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}`;
                imageWrapperDiv.innerHTML = `<p style="text-align:center; padding: 20% 5px; font-size:0.8em; color:#777;">Image failed to load</p>`;
                completeItemSetupAndAnimate();
            };
            
            img.src = imageUrl;

        });

    } catch (error) {
        console.error('Error loading thumbnails:', error);
        gallery.innerHTML = `<p class="placeholder-text" style="color:red;">Error: ${error.message}</p>`;
    }
}

async function loadVideos() {
    const gallery = document.getElementById('video-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    try {
        const response = await fetch('videos/videos.txt');
        if (!response.ok) throw new Error(`Failed to fetch videos.txt: ${response.status}`);
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            gallery.innerHTML = '<p class="placeholder-text"><code>videos/videos.txt</code> is empty.</p>';
            return;
        }

        lines.forEach((line, index) => {
            const match = line.match(/(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[&?].*)?|https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+))(?: "?([^"]*)"?)?/);

            if (match) {
                const videoId = match[2] || match[3];
                const additionalText = match[4] ? match[4].trim() : "";

                const videoItemDiv = document.createElement('div');
                videoItemDiv.className = 'video-item';

                const iframeWrapperDiv = document.createElement('div');
                iframeWrapperDiv.className = 'video-iframe-wrapper';

                const iframe = document.createElement('iframe');
                iframe.loading = "lazy"; 
                iframe.src = `https://www.youtube.com/embed/${videoId}`;
                iframe.title = additionalText || `YouTube video: ${videoId}`;
                iframe.frameBorder = "0";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                iframe.allowFullscreen = true;
                
                iframeWrapperDiv.appendChild(iframe);
                videoItemDiv.appendChild(iframeWrapperDiv);

                if (additionalText) {
                    const caption = document.createElement('p');
                    caption.className = 'video-caption';
                    caption.textContent = additionalText;
                    videoItemDiv.appendChild(caption);
                }
                gallery.appendChild(videoItemDiv);

                const itemStaggerDelay = index * 0.12;
                videoItemDiv.style.transitionDelay = `${itemStaggerDelay}s`;

                requestAnimationFrame(() => { 
                     requestAnimationFrame(() => { 
                        videoItemDiv.classList.add('item-loaded');
                     });
                });

            } else {
                console.warn(`Could not parse video line: ${line}`);
            }
        });

    } catch (error) {
        console.error('Error loading videos:', error);
        gallery.innerHTML = `<p class="placeholder-text" style="color:red;">Error: ${error.message}</p>`;
    }
}