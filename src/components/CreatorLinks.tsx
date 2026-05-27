import { CheckIcon, ClipboardCopyIcon, GitHubLogoIcon, LinkedInLogoIcon } from '@radix-ui/react-icons';
import { memo, useState } from 'react';

import { useI18n } from '../i18n';
import { copyText } from '../utils/clipboard';

const SUPPORT_EMAIL = 'sharma.pratik2016@gmail.com';
const LINKEDIN_URL = 'https://linkedin.com/in/biomathcode';
const GITHUB_URL = 'https://github.com/biomathcode';

function CreatorLinks() {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);

    const copySupportEmail = async () => {
        await copyText(SUPPORT_EMAIL);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <section className="grid gap-2 border-t border-neutral-200 pt-3 sm:pt-4" aria-label={t('creatorLinks')}>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('createdBy')}</p>
            <div className="flex flex-wrap items-center gap-2">
                <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <LinkedInLogoIcon />
                    {t('linkedin')}
                </a>
                <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    <GitHubLogoIcon />
                    {t('github')}
                </a>
                <button
                    type="button"
                    onClick={copySupportEmail}
                    title={SUPPORT_EMAIL}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                    {copied ? <CheckIcon /> : <ClipboardCopyIcon />}
                    {copied ? t('supportEmailCopied') : t('copySupportEmail')}
                </button>
            </div>
        </section>
    );
}

export default memo(CreatorLinks);
