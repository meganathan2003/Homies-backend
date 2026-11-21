import { Request, Response } from 'express';
import * as consultationService from '../services/consultation.service';
import * as paymentService from '../services/payment.service';
import * as walletService from '../services/wallet.service';
import { consultationListSchema } from '../validators/consultation.validator';
import { ok } from '../utils/response';

/** Free credit / wallet la irundhu pay. Wallet kammi na 402 + code INSUFFICIENT_BALANCE (app UPI option kaattalam). */
export async function start(req: Request, res: Response) {
    const { consultation, alreadyActive } = await consultationService.start(req.user!, req.body.expertId);
    const balancePaise = await walletService.getBalancePaise(req.user!.id);
    return ok(
        res,
        { consultation: consultationService.toConsultationDto(consultation), alreadyActive, balance: walletService.toRupees(balancePaise) },
        alreadyActive ? 'Consultation already active' : 'Consultation started',
        alreadyActive ? 200 : 201,
    );
}

/** Direct payment (UPI, card, netbanking): Razorpay order create. */
export async function createOrder(req: Request, res: Response) {
    return ok(res, await paymentService.createConsultationOrder(req.user!, req.body.expertId), 'Order created', 201);
}

/** Razorpay success aana piragu verify. Payment verify aana piragu thaan chat open aagum. */
export async function verify(req: Request, res: Response) {
    const r = await paymentService.verifyConsultation(req.user!, req.body);
    if (!r.consultation) {
        return ok(res, { processing: true }, 'Payment received, setting up your consultation. Please retry in a moment.');
    }
    return ok(
        res,
        { consultation: consultationService.toConsultationDto(r.consultation), alreadyProcessed: r.alreadyProcessed },
        r.alreadyProcessed ? 'Consultation already started' : 'Consultation started',
        r.alreadyProcessed ? 200 : 201,
    );
}

export async function listMine(req: Request, res: Response) {
    const q = consultationListSchema.parse(req.query);
    return ok(res, { consultations: await consultationService.listMine(req.user!, q.status) });
}

export async function complete(req: Request, res: Response) {
    const c = await consultationService.complete(req.user!, String(req.params.id));
    return ok(res, consultationService.toConsultationDto(c), 'Consultation completed');
}