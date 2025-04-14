document.getElementById('videoFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    uploadVideoToVimeo(file);
});


async function uploadVideoToVimeo(file) {
    const accessToken = 'be069a80112936b270f72d04149e7376';
    const createUploadUrl = 'https://api.vimeo.com/me/videos';

    try {
        iweb.showBusy(true, 70);
        // Step 1: Request an upload ticket
        const uploadTicketResponse = await fetch(createUploadUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                upload: {
                    approach: 'tus',
                    size: file.size,
                },
                name: file.name
            })
        });

        if (!uploadTicketResponse.ok) {
            throw new Error(`Failed to create upload ticket: ${uploadTicketResponse.statusText}`);
        }

        const uploadTicket = await uploadTicketResponse.json();
        const uploadUrl = uploadTicket.upload.upload_link;

        console.log('Upload URL:', uploadUrl);

        // Step 2: Upload the video file using the TUS protocol
        const tusResponse = await fetch(uploadUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/offset+octet-stream',
                'Upload-Offset': '0',
                'Tus-Resumable': '1.0.0',
            },
            body: file,
        });

        if (!tusResponse.ok) {
            throw new Error(`Failed to upload video: ${tusResponse.statusText}`);
        }

        console.log('Video uploaded successfully');
        console.log(uploadTicket);

        // Step 3: Verify and return the video URI
        const videoUri = uploadTicket.link;
        $('input[name="content"]').val(videoUri);
    } catch (error) {
        console.error('Error uploading video to Vimeo:', error);
        alert('Failed to upload the video.');
    }
    finally {
        setTimeout(function() {
            iweb.showBusy(false);
            previewVimeo();
        }, 6000);
    }
}
