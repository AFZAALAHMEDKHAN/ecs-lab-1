#!/bin/bash

# Enhanced JWT Tool for Scaler Vulnersity Labs
# Supports:
#   - decode <jwt>
#   - encode (interactive)
#   - encode-from-file <header.json> <payload.json> <secret>

base64url_encode() {
    base64 | tr -d '\n' | tr '+/' '-_' | tr -d '='
}

decode_jwt() {
    jwt=$1
    IFS='.' read -r header payload signature <<< "$jwt"

    echo "Header:"
    echo "$header" | base64 --decode 2>/dev/null | jq .

    echo ""
    echo "Payload:"
    echo "$payload" | base64 --decode 2>/dev/null | jq .

    echo ""
    echo "Signature:"
    echo "$signature"
}

encode_from_file() {
    header_file=$1
    payload_file=$2
    secret=$3

    header=$(cat "$header_file" | base64url_encode)
    payload=$(cat "$payload_file" | base64url_encode)

    signature=$(printf "%s.%s" "$header" "$payload" \
        | openssl dgst -sha256 -hmac "$secret" -binary \
        | base64url_encode)

    echo ""
    echo "Generated JWT:"
    echo "$header.$payload.$signature"
}

interactive_modify_token() {
    echo "Paste the existing JWT:"
    read old_jwt

    IFS='.' read -r header payload signature <<< "$old_jwt"

    decoded_header=$(echo "$header" | base64 --decode 2>/dev/null)
    decoded_payload=$(echo "$payload" | base64 --decode 2>/dev/null)

    echo ""
    echo "Decoded Header:"
    echo "$decoded_header" | jq .

    echo ""
    echo "Decoded Payload:"
    echo "$decoded_payload" | jq .

    echo ""
    echo "Modify header fields? (y/n)"
    read modify_header

    if [ "$modify_header" = "y" ]; then
        echo "$decoded_header" > temp_header.json
        for key in $(echo "$decoded_header" | jq -r 'keys[]'); do
            value=$(echo "$decoded_header" | jq -r --arg k "$key" '.[$k]')
            echo "Current header field: $key = $value"
            echo "Change this field? (y/n)"
            read change
            if [ "$change" = "y" ]; then
                echo "Enter new value:"
                read new_value
                jq --arg k "$key" --arg v "$new_value" '.[$k]=$v' temp_header.json > temp_header2.json
                mv temp_header2.json temp_header.json
            fi
        done
        final_header=$(cat temp_header.json)
    else
        final_header="$decoded_header"
    fi

    echo ""
    echo "Modify payload fields? (y/n)"
    read modify_payload

    if [ "$modify_payload" = "y" ]; then
        echo "$decoded_payload" > temp_payload.json
        for key in $(echo "$decoded_payload" | jq -r 'keys[]'); do
            value=$(echo "$decoded_payload" | jq -r --arg k "$key" '.[$k]')
            echo "Current payload field: $key = $value"
            echo "Change this field? (y/n)"
            read change
            if [ "$change" = "y" ]; then
                echo "Enter new value:"
                read new_value
                jq --arg k "$key" --arg v "$new_value" '.[$k]=$v' temp_payload.json > temp_payload2.json
                mv temp_payload2.json temp_payload.json
            fi
        done
        final_payload=$(cat temp_payload.json)
    else
        final_payload="$decoded_payload"
    fi

    echo ""
    echo "Enter secret key for signing:"
    read secret

    encoded_header=$(echo "$final_header" | base64url_encode)
    encoded_payload=$(echo "$final_payload" | base64url_encode)

    signature=$(printf "%s.%s" "$encoded_header" "$encoded_payload" \
        | openssl dgst -sha256 -hmac "$secret" -binary \
        | base64url_encode)

    echo ""
    echo "New JWT:"
    echo "$encoded_header.$encoded_payload.$signature"

    rm -f temp_header.json temp_payload.json
}

interactive_encode() {
    echo "Choose encoding mode:"
    echo "1) Modify existing token"
    echo "2) Create new token from files"
    read mode

    if [ "$mode" = "1" ]; then
        interactive_modify_token
    elif [ "$mode" = "2" ]; then
        echo "Enter header.json path:"
        read header_file
        echo "Enter payload.json path:"
        read payload_file
        echo "Enter secret:"
        read secret
        encode_from_file "$header_file" "$payload_file" "$secret"
    else
        echo "Invalid option"
    fi
}

case "$1" in
    decode)
        decode_jwt "$2"
        ;;
    encode)
        interactive_encode
        ;;
    encode-from-file)
        encode_from_file "$2" "$3" "$4"
        ;;
    *)
        echo "Usage:"
        echo "  $0 decode <jwt>"
        echo "  $0 encode"
        echo "  $0 encode-from-file <header.json> <payload.json> <secret>"
        ;;
esac
